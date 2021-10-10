'use strict';

const Hapi = require('hapi');
const Sequelize = require("sequelize");
const { where } = require('sequelize');

const sequelize = new Sequelize("test_db", "postgres", "1", {
  dialect: "postgres"
});

const Student = sequelize.define("student",{
    id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4
    }, 

    firstName: {
        type: Sequelize.STRING,
        allowNull: false
    },

    lastName: {
        type: Sequelize.STRING,
        allowNull: false
    },

    sex: {
        type: Sequelize.STRING,
        allowNull: false
    },

    phone: {
        type: Sequelize.STRING,
        allowNull: false
    },

    /*faculty: {
        type: Sequelize.INTEGER,
        allowNull: false
    },*/

    averageGrade: {
        type: Sequelize.INTEGER,
        allowNull: false
    }
});

const Faculty = sequelize.define("faculty",{
    facultyName: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

Student.belongsTo(Faculty, {foreignKey: "facultyId"});

sequelize.sync(/*{force : true}*/);

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    server.route({
        method: 'GET',
        path: '/students/', //получить список студентов вместе с информацией о них
        handler: async (request, h) => {
            let res = await Student.findAll({
                include: {
                    model: Faculty,
                    attributes: ["facultyName"]
                }
            });

            return res;
        }
    });

    server.route({
        method: 'GET', //получить список факультетов
        path: '/faculties/',
        handler: async (request, h) => {
            let res = await Faculty.findAll({

            });

            return res;
        }
    });

    server.route({
        method: 'POST',
        path: '/faculties/', //добавсть в базу факультет
        handler: async (request, h) => {
            let res = await Faculty.create({
                id: request.payload.id,
                facultyName: request.payload.facultyName
            });

            console.log(request.payload.facultyName);

            return 'faculty ' + request.payload.facultyName + ' is created';
        }
    });

    server.route({
        method: 'POST',
        path: '/students/', //добавить в базу студента
        handler: async (request, h) => {
            let res = await Student.create({
                firstName: request.payload.firstName,
                lastName: request.payload.lastName,
                sex: request.payload.sex,
                phone: request.payload.phone,
                facultyId: request.payload.facultyId,
                averageGrade: request.payload.averageGrade
            });

            return "student" + request.payload.firstName + ' is created';
        }
    });

    server.route({
        method: 'GET',
        path: '/students/{faculty}', //получить список студентов факульета {faculty} в порядке убывания средней оценки
        handler: async (request, h) => {
            let res = await Student.findAll({
                attributes : [
                    'firstName',
                    'averageGrade'
                ], 

                order : [
                    ['averageGrade', 'DESC']
                ],

                include: {
                    model: Faculty,
                    attributes: ["facultyName"],
                    where : {
                        facultyName : request.params.faculty
                    }   
                } 
            });   

            return res;
        }
    });

    server.route({
        method: 'GET',
        path: '/students/by_id/{student_id}', //получить информацию о студенте {student_id}
        handler: async (request, h) => {
            let res = await Student.findAll({
                include: {
                    model: Faculty,
                    attributes: ["facultyName"]
                },

                where : {
                    id : request.params.student_id
                }   
            });   

            return res;
        }
    });

    server.route({
        method: 'GET',
        path: '/students/{faculty}/average', //получить среднюю оценку по факультету {faculty_name}
        handler: async (request, h) => {
            let res = await Student.findOne({
                attributes : [[Sequelize.fn('avg', Sequelize.col('averageGrade')), 'averageGradeForTheFaculty']], 
                include : {
                    model: Faculty,
                    where : {
                        facultyName : request.params.faculty
                    }
                }
                
            });   

            return res;
        }
    });

    server.route({
        method: 'GET',
        path: '/faculties/{faculty}/calc/{calc_function}', //получение максимальной/миниальной оценки студента по факультету {faculty}
        handler: async (request, h) => {
            if (request.params.calc_function == "min") {
                let res = await Student.min('averageGrade', { 
                    include: {
                        model: Faculty,
                        //attributes: ["facultyName"],
                        where : {
                            facultyName : request.params.faculty
                        }   
                    }
                });

                return res;
            } else if (request.params.calc_function == "max") {
                let res = await Student.max('averageGrade', { 
                    include: {
                        model: Faculty,
                        //attributes: ["facultyName"],
                        where : {
                            facultyName : request.params.faculty
                        }   
                    }
                });

                return res;
            }

            return res;
        }
    });

    server.route({
        method: 'GET',
        path: '/students/sex/{sex}/calc/{calc_function}', //получение максимальной/миниальной оценки студента по гендеру {sex}
        handler: async (request, h) => {
            if (request.params.calc_function == "min") {
                let res = await Student.min('averageGrade', { where: {sex : request.params.sex} });

                return res;
            } else if (request.params.calc_function == "max") {
                let res = await Student.max('averageGrade', { where: {sex : request.params.sex} });

                return res;
            }

            return res;
        }
    });

    server.route({
        method: 'PUT',
        path: '/students/by_id/{student_id}', //изменение информации о студенте
        handler: async (request, h) => {
                await Student.update({
                    firstName: request.payload.firstName,
                    lastName: request.payload.lastName,
                    sex: request.payload.sex,
                    phone: request.payload.phone,
                    facultyId: request.payload.facultyId,
                    averageGrade: request.payload.averageGrade
                }, {
                
                where: {
                    id: request.params.student_id
                }
            });

            return 'information about user ' + request.payload.firstName + ' is changed';
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