<?php

declare(strict_types=1);

namespace App\Services;

use PDO;
use DateTimeImmutable;
use InvalidArgumentException;

enum Priority: string
{
    case HIGH = 'Alta';
    case MEDIUM = 'Média';
    case LOW = 'Baixa';
}

enum Category: string
{
    case WORK_FISCAL = 'Fiscal';
    case WORK_DEV = 'Desenvolvimento';
    case LEISURE = 'Lazer';
    case PERSONAL = 'Pessoal';
}

readonly class AgendaItem
{
    public function __construct(
        public string $title,
        public DateTimeImmutable $start,
        public DateTimeImmutable $end,
        public Priority $priority,
        public Category $category,
        public ?string $notes = null
    ) {
        if ($start >= $end) {
            throw new InvalidArgumentException("Start time must be before end time.");
        }
    }

    public function getDurationString(): string
    {
        $interval = $this->start->diff($this->end);
        return $interval->format('%Hh %Im');
    }
}

class AgendaService
{
    public function __construct(
        private PDO $db
    ) {
        // Opcional: configurar timezone
        date_default_timezone_set('America/Sao_Paulo');
    }

    /**
     * Gera a agenda para uma semana específica misturando rotinas e eventos fixos.
     * @return array<string, array<AgendaItem>> Agrupado por dia (Y-m-d)
     */
    public function getWeeklyAgenda(DateTimeImmutable $startDate): array
    {
        $endDate = $startDate->modify('+6 days 23:59:59');
        
        // 1. Buscar eventos fixos do banco
        $fixedEvents = $this->fetchFixedEvents($startDate, $endDate);
        
        // 2. Gerar blocos de rotina
        $routineEvents = $this->generateRoutineBlocks($startDate, $endDate);

        // 3. Merge e Sort
        $allEvents = array_merge($fixedEvents, $routineEvents);
        
        usort($allEvents, fn(AgendaItem $a, AgendaItem $b) => $a->start <=> $b->start);

        // 4. Agrupar por dia
        $grouped = [];
        foreach ($allEvents as $event) {
            $dayKey = $event->start->format('Y-m-d');
            $grouped[$dayKey][] = $event;
        }

        return $grouped;
    }

    private function fetchFixedEvents(DateTimeImmutable $start, DateTimeImmutable $end): array
    {
        $sql = "SELECT * FROM appointments 
                WHERE start_time BETWEEN :start AND :end 
                ORDER BY start_time ASC";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'start' => $start->format('Y-m-d H:i:s'),
            'end'   => $end->format('Y-m-d H:i:s')
        ]);

        $events = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $events[] = new AgendaItem(
                title: $row['title'],
                start: new DateTimeImmutable($row['start_time']),
                end: new DateTimeImmutable($row['end_time']),
                priority: Priority::tryFrom($row['priority'] ?? '') ?? Priority::MEDIUM,
                category: Category::tryFrom($row['category'] ?? '') ?? Category::WORK_FISCAL,
                notes: $row['notes'] ?? null
            );
        }
        return $events;
    }

    private function generateRoutineBlocks(DateTimeImmutable $start, DateTimeImmutable $end): array
    {
        $blocks = [];
        $current = $start;

        // Loop pelos dias para adicionar rotina padrão
        while ($current <= $end) {
            $currentDay = $current; // Manter referência para o dia atual
            
            // Pula finais de semana para trabalho principal (exemplo)
            if ($currentDay->format('N') <= 5) {
                // Manhã: Fiscal - CRIAR NOVOS OBJETOS a partir do dia atual
                $blocks[] = new AgendaItem(
                    title: "Trabalho Principal (Fiscal)",
                    start: $currentDay->setTime(8, 0),
                    end: $currentDay->setTime(12, 0),
                    priority: Priority::MEDIUM,
                    category: Category::WORK_FISCAL
                );

                // Tarde: Dev/Automação
                $blocks[] = new AgendaItem(
                    title: "Desenvolvimento Web & Automação",
                    start: $currentDay->setTime(14, 0),
                    end: $currentDay->setTime(18, 0),
                    priority: Priority::MEDIUM,
                    category: Category::WORK_DEV
                );
            }
            
            // Exercício (Todos os dias)
            $blocks[] = new AgendaItem(
                title: "Exercícios / Academia",
                start: $currentDay->setTime(19, 0),
                end: $currentDay->setTime(20, 0),
                priority: Priority::LOW,
                category: Category::LEISURE
            );

            // Avançar para o próximo dia - criar NOVO objeto imutável
            $current = $current->modify('+1 day');
        }

        return $blocks;
    }
}
