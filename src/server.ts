'use strict';

import Ticket from "./Ticket"; // Импорт интерфейса Ticket
import TicketFull from "./TicketFull"; // Импорт интерфейса TicketFull

const express = require('express'); // Подключение модуля для работы с веб-сервером
const cors = require('cors'); // Подключение модуля для работы с политикой CORS
const path = require('path'); // Подключение модуля для работы с путями
const fs = require('fs'); // Подключение модуля для работы с файловой системой
const { v1: uuidv1 } = require('uuid'); // Подключение модуля для работы с идентификаторами

const server = express(); // Инициализация веб-сервера
server.use(cors()); // Использование веб-сервером политики CORS
const jsonParser = express.json(); // инициализация парсера для получения тела запроса
const pathToFile: string = path.resolve(__dirname, '../ticketsBase.json'); // путь до файла с данными

function readDataFile(method: string, res: any, id?: number) {
    const data: Array<TicketFull> = JSON.parse(fs.readFileSync(pathToFile, 'utf8')); // Чтение данных из JSON файла
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

server.put('/', jsonParser, (req: any, res: any) => {
    if (req.query.method === 'ticketById') {
        if (req.body.id !== '' && req.body.status !== '') {
            const data: Array<TicketFull> = JSON.parse(fs.readFileSync(pathToFile, 'utf8')); // Чтение данных из JSON файла
            let elem = data.filter(el => el.id == req.body.id)[0];
            elem.name = req.body.name === '' ? req.body.name : elem.name;
            elem.description = req.body.description === '' ? req.body.description : elem.description;
            elem.status = req.body.status;
            data.filter(el => el.id !== req.body.id).push(elem);
            fs.writeFileSync(pathToFile, JSON.stringify(data, null, 4)); // Запись массива в файл
            res.send('status changed!');
        }
    } else {
        res.statusCode = 503;
        res.send('Unknown PUT request');
    }
});

server.delete('/', (req: any, res: any) => {
    if (req.query.method === 'ticketById') {
        if (req.query.id !== '') {
            const data: Array<TicketFull> = JSON.parse(fs.readFileSync(pathToFile, 'utf8')); // Чтение данных из JSON файла
            let remId = data.filter(el => el.id !== req.query.id);
            fs.writeFileSync(pathToFile, JSON.stringify(remId, null, 4)); // Запись массива в файл
            res.send('ok');
        }
    } else {
        res.statusCode = 503;
        res.send('Unknown Delete request');
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
            const data: Array<TicketFull> = JSON.parse(fs.readFileSync(pathToFile, 'utf8')); // Чтение данных из JSON файла
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
    server.listen(process.env.PORT); // Запуск сервера
    console.log('Server started, port:', process.env.PORT); // Информирование об IP:PORT удаленного сервера
} catch (e: any) { console.error('Start server error:', e.code) }; // Сообщение об ошибки в случае ошибки