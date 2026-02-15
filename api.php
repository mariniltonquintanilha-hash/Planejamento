<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    // Gerar dados de agenda diretamente sem dependências externas
    $weekStart = new DateTime('monday this week');
    $weekEnd = clone $weekStart;
    $weekEnd->modify('+6 days 23:59:59');
    
    $agenda = generateAgenda($weekStart, $weekEnd);
    
    // Converter para formato JSON
    $result = [];
    foreach ($agenda as $day => $items) {
        $result[$day] = $items;
    }
    
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
}

function generateAgenda(DateTime $start, DateTime $end): array
{
    $blocks = [];
    $current = clone $start;
    
    $priorities = ['Alta', 'Média', 'Baixa'];
    $categories = ['Fiscal', 'Desenvolvimento', 'Lazer', 'Pessoal'];
    
    $priorityMap = [
        'Alta' => 'HIGH',
        'Média' => 'MEDIUM',
        'Baixa' => 'LOW'
    ];
    
    // Loop por cada dia da semana
    while ($current <= $end) {
        $dayKey = $current->format('Y-m-d');
        $dayOfWeek = (int)$current->format('N');
        
        // Verificar se não é fim de semana para trabalho
        if ($dayOfWeek <= 5) {
            // Trabalho Fiscal - Manhã
            $startTime = clone $current;
            $startTime->setTime(8, 0);
            $endTime = clone $current;
            $endTime->setTime(12, 0);
            
            $interval = $startTime->diff($endTime);
            $duration = $interval->format('%Hh %Im');
            
            $blocks[$dayKey][] = [
                'title' => 'Trabalho Principal (Fiscal)',
                'start' => $startTime->format('Y-m-d H:i'),
                'end' => $endTime->format('Y-m-d H:i'),
                'duration' => $duration,
                'priority' => 'Média',
                'category' => 'Fiscal',
                'priorityKey' => 'MEDIUM',
                'notes' => null
            ];
            
            // Desenvolvimento - Tarde
            $startTime = clone $current;
            $startTime->setTime(14, 0);
            $endTime = clone $current;
            $endTime->setTime(18, 0);
            
            $interval = $startTime->diff($endTime);
            $duration = $interval->format('%Hh %Im');
            
            $blocks[$dayKey][] = [
                'title' => 'Desenvolvimento Web & Automação',
                'start' => $startTime->format('Y-m-d H:i'),
                'end' => $endTime->format('Y-m-d H:i'),
                'duration' => $duration,
                'priority' => 'Média',
                'category' => 'Desenvolvimento',
                'priorityKey' => 'MEDIUM',
                'notes' => null
            ];
        }
        
        // Exercício - Todos os dias
        $startTime = clone $current;
        $startTime->setTime(19, 0);
        $endTime = clone $current;
        $endTime->setTime(20, 0);
        
        $interval = $startTime->diff($endTime);
        $duration = $interval->format('%Hh %Im');
        
        $blocks[$dayKey][] = [
            'title' => 'Exercícios / Academia',
            'start' => $startTime->format('Y-m-d H:i'),
            'end' => $endTime->format('Y-m-d H:i'),
            'duration' => $duration,
            'priority' => 'Baixa',
            'category' => 'Lazer',
            'priorityKey' => 'LOW',
            'notes' => null
        ];
        
        $current->modify('+1 day');
    }
    
    // Ordenar eventos por hora de início
    foreach ($blocks as &$dayEvents) {
        usort($dayEvents, function($a, $b) {
            return strcmp($a['start'], $b['start']);
        });
    }
    
    return $blocks;
}
