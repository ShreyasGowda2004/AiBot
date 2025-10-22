package com.aichatbot.config;

import com.aichatbot.repository.EmbeddingStore;
import com.aichatbot.repository.FileEmbeddingStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Path;

@Configuration
public class EmbeddingStoreConfig {

    @Value("${embedding.store.dir:#{systemProperties['user.home']}/.ai-chatbot/embeddings}")
    private String embeddingDir;

    @Bean
    public EmbeddingStore embeddingStore() {
        return new FileEmbeddingStore(Path.of(embeddingDir));
    }
}
