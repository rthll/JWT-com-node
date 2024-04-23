const mysql = require("mysql2");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.login = async (req, res) => {
    try {
        const { email, senha } = req.body;

        db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (error, results) => {
            if (error) {
                console.log(error);
            }

            if (results.length === 0 || !(await bcrypt.compare(senha, results[0].senha))) {
                console.log("Senha errada!")
                return res.status(401).render('login', {
                    message: 'Email ou senha incorretos!'
                });
            } else {
                const id = results[0].id;
                const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                });

                console.log('Token:', token);

                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                    ),
                    httpOnly: true
                };

                res.cookie('jwt', token, cookieOptions);
                res.redirect('/');
            }
        });

    } catch (error) {
        console.log(error);
    }
};

exports.register = (req, res) => {
    const { name, email, tel, grupo, senha, passwordConfirm } = req.body;

    db.query('SELECT email FROM usuarios WHERE email = ?', [email], async (error, results) => {
        if(error) {
            console.log(error);
        }

        if( results.length > 0) {
            return res.render('register', {
                message: 'Esse email já existe!'
            })
        } else if(senha !== passwordConfirm){
            return res.render('register', {
                message: 'As senhas não conferem!'
            })
        }

        let hashedPassword = await bcrypt.hash(senha, 8);
        console.log(hashedPassword);

        db.query('INSERT INTO usuarios SET ?', {nome: name, email: email, tel: tel, grupo: grupo, senha: hashedPassword}, (erros,results) => {
            if(error){
                console.log(error);
            } else {
                console.log(results);
                return res.render('register', {
                    message: 'Usuário registrado!'
                });
            }
        })

    })


}