package com.aichatbot.controller;

import com.aichatbot.service.OllamaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/health")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"}, allowCredentials = "true")
public class HealthController {
    
    private final OllamaService ollamaService;
    
    public HealthController(OllamaService ollamaService) {
        this.ollamaService = ollamaService;
    }
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> healthCheck() {
        boolean ollamaHealthy = ollamaService.isHealthy();
        
        Map<String, Object> health = Map.of(
                "status", ollamaHealthy ? "UP" : "DOWN",
                "services", Map.of(
                        "ollama", ollamaHealthy ? "UP" : "DOWN",
                        "embeddingStore", "UP",
                        "application", "UP"
                )
        );
        
        if (ollamaHealthy) {
            return ResponseEntity.ok(health);
        } else {
            return ResponseEntity.status(503).body(health);
        }
    }
}
