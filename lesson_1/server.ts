'use strict';

import Hapi from 'hapi';
import { v4 as uuidv4 } from 'uuid';
let usersId : string[];
let id;

const init = async () => {
console.log(usersId);
    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: (request: any, h: any) => {
            id = uuidv4();
            usersId.push(id);

            console.log(usersId);

            return 'Hello, ' + id;
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();

