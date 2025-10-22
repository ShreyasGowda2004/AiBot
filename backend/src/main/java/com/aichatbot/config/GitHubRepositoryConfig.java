package com.aichatbot.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "repo.github")
public class GitHubRepositoryConfig {
    
    private String baseurl;
    private String token;
    private List<Repository> repositories;
    
    public String getBaseurl() {
        return baseurl;
    }
    
    public void setBaseurl(String baseurl) {
        this.baseurl = baseurl;
    }
    
    public String getToken() {
        return token;
    }
    
    public void setToken(String token) {
        this.token = token;
    }
    
    public List<Repository> getRepositories() {
        return repositories;
    }
    
    public void setRepositories(List<Repository> repositories) {
        this.repositories = repositories;
    }
    
    public static class Repository {
        private String owner;
        private String name;
        private String branch;
        
        public String getOwner() {
            return owner;
        }
        
        public void setOwner(String owner) {
            this.owner = owner;
        }
        
        public String getName() {
            return name;
        }
        
        public void setName(String name) {
            this.name = name;
        }
        
        public String getBranch() {
            return branch;
        }
        
        public void setBranch(String branch) {
            this.branch = branch;
        }
        
        public String getFullName() {
            return owner + "/" + name;
        }
    }
}
