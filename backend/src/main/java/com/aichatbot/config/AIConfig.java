package com.aichatbot.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AIConfig {

    @Value("${spring.ai.ollama.base-url}")
    private String ollamaBaseUrl;

    @Value("${spring.ai.ollama.chat.model}")
    private String chatModel;

    @Value("${spring.ai.ollama.embedding.model}")
    private String embeddingModel;

    // Simple configuration for now - can be enhanced when Spring AI dependencies are properly resolved
    @Bean
    public String ollamaBaseUrl() {
        return ollamaBaseUrl;
    }

    @Bean 
    public String chatModelName() {
        return chatModel;
    }
    
    @Bean
    public String embeddingModelName() {
        return embeddingModel;
    }
}
