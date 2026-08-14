import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';

const startServer = async (): Promise<void> => {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`🚀 TaskFlow Backend Server running on port ${env.PORT} [${env.NODE_ENV}]`);
      console.log(`📑 Swagger Documentation available at http://localhost:${env.PORT}/api-docs`);
      console.log(`🩺 Health check available at http://localhost:${env.PORT}/health`);
      console.log(`🔗 API Base URL: http://localhost:${env.PORT}/api/v1`);
    });

    const handleShutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log('🏁 Server closed cleanly.');
        process.exit(0);
      });

      // Force close after 10s if graceful shutdown hangs
      setTimeout(() => {
        console.error('⚠️ Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
