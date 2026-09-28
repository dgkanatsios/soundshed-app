export const envSettings = {
    YoutubeAPIKey: process.env.YOUTUBE_API_KEY || '',
    IsWebMode: true,
    Version: "1.5.0",
    SparkTransport: "ble", // "ble" or "tcp-sim"
    SparkSimulatorHost: "127.0.0.1",
    SparkSimulatorPort: 9124,
    SparkSimulatorModel: "spark-2",
    SparkSimulatorVerbose: true
};

export default envSettings;
