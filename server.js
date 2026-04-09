import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Определяем __dirname для ES-модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5004; // Порт, на котором будет работать наш сервер

// Путь к нашей папке со статическими файлами (собранным React-приложением)
const staticPath = path.join(__dirname, 'dist');

// --- Ключевая часть ---
// Мы говорим Express, что для всех запросов, начинающихся с /page4,
// нужно искать файлы в папке staticPath (т.е. в папке dist).
app.use('/page4', express.static(staticPath));

// Эта часть нужна, чтобы при обновлении страницы на /page4/profile
// сервер не искал файл /profile, а возвращал главный index.html.
// React-роутер на клиенте сам разберется, какой компонент показать.
app.get('/page4/*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен и слушает порт ${PORT}`);
    console.log(`Приложение доступно по адресу http://localhost:${PORT}/page4/`);
});
