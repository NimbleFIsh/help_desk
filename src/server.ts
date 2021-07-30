'use strict';

import Ticket from "./Ticket"; // Импорт интерфейса Ticket
import TicketFull from "./TicketFull"; // Импорт интерфейса TicketFull

const ip = require('ip'); // Подключение модуля для работы с ip адрессом удаленного сервера
const express = require('express'); // Подключение модуля для работы с веб-сервером
const cors = require('cors'); // Подключение модуля для работы с политикой CORS
const path = require('path'); // Подключение модуля для работы с путями
const fs = require('fs'); // Подключение модуля для работы с файловой системой
const { v1: uuidv1 } = require('uuid'); // Подключение модуля для работы с идентификаторами
const PORT = process.env.port || 3030; // Задание порта сервера

const server = express(); // Инициализация веб-сервера
server.use(cors()); // Использование веб-сервером политики CORS
const jsonParser = express.json(); // инициализация парсера для получения тела запроса
const pathToFile: string = path.resolve(__dirname, '../ticketsBase.json'); // путь до файла с данными

function readDataFile(method: string, res: any, id?: number) {
    const data: Array<Ticket> = JSON.parse(fs.readFileSync(pathToFile, 'utf8')); // Чтение данных из JSON файла
    let another;
    if (id !== undefined) {
        if ((data.filter(el => el.id === id)).length !== 0) another = data.filter((tk: Ticket) => tk.id === id);
        else {
            res.statusCode = 403;
            another = 'Access error! Id is not exists!';
        }
    }
    res.json(method === 'allTickets' ? data : another);
}

server.get('/', (req: any, res: any) => { // Обработка GET запроса
    switch(req.query.method) {
        case 'allTickets':
            readDataFile('allTickets', res);
            break;

        case 'ticketById':
            readDataFile('ticketById', res, req.query.id);
            break;

        default:
            res.statusCode = 404;
            res.send('Unknown Query!');
            break;
    }
});

server.post('/', jsonParser, (req: any, res: any) => { // Обработка POST запроса
    if (req.query.method === 'createTicket') {
        if (req.body.name == '' || req.body.description == '' || req.body.status == undefined)
            res.send('Ошибка создания тикета, не заполнены обязательные поля');
        
        const ticket : TicketFull = {
            id: uuidv1(),
            name: req.body.name,
            description: req.body.description,
            status: req.body.status,
            created: new Date().getTime()
        }

        try {
            const data: Array<Ticket> = JSON.parse(fs.readFileSync(pathToFile, 'utf8')); // Чтение данных из JSON файла
            data.push(ticket); // Запись нового тикета в общий массив
            fs.writeFileSync(pathToFile, JSON.stringify(data, null, 4)); // Запись массива в файл
            res.send('Тикет успешно создан!');
        } catch (e) {
            console.error(e); // Логирование ошибки
            res.statusCode = 503;
            res.send('Ошибка при создании тикета!');
        }        
    }
});

try { // Отлавливание оишбки
    server.listen(PORT); // Запуск сервера
    console.log(`Server started on ${ip.address()}:${PORT}`); // Информирование об IP:PORT удаленного сервера
} catch (e: any) { console.error('Start server error:', e.code) }; // Сообщение об ошибки в случае ошибки