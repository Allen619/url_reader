declare namespace NodeJS {
  interface ProcessEnv {
    REDIS_HOST: string;
    REDIS_PORT: string;
    REDIS_PASSWORD?: string;
    REDIS_DB: string;
    TASK_MAX_ATTEMPTS: string;
    TASK_RETRY_DELAY: string;
    TASK_EXPIRE_TIME: string;
    NOTION_TOKEN: string;
    NOTION_DATABASE_ID: string;
  }
}
