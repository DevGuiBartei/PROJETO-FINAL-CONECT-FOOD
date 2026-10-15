import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_connect_food_jwt_key_2026';

class AuthController {
    async login(req, res) {
        try {
            const { email, password, senha } = req.body;
            const inputPassword = password || senha;

            if (!email || !inputPassword) {
                return res.status(400).json({ erro: 'Por favor, informe e-mail e senha.' });
            }

            const emailNormalizado = email.toLowerCase().trim();
            const [users] = await pool.query(
                `SELECT u.*, GROUP_CONCAT(r.nome_restricao SEPARATOR ', ') as restricoes
                 FROM usuarios u
                 LEFT JOIN usuario_restricao ur ON u.id_usuario = ur.id_usuario
                 LEFT JOIN restricoes_alimentares r ON ur.id_restricao = r.id_restricao
                 WHERE LOWER(u.email) = ?
                 GROUP BY u.id_usuario`,
                [emailNormalizado]
            );

            if (users.length === 0) {
                return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
            }

            const user = users[0];

            if (!user.status) {
                return res.status(403).json({ erro: 'Usuário inativo. Entre em contato com a direção.' });
            }

            const isMatch = await bcrypt.compare(inputPassword, user.senha);
            if (!isMatch) {
                return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
            }

            const token = jwt.sign(
                {
                    id_usuario: user.id_usuario,
                    email: user.email,
                    perfil: user.perfil,
                    nome: user.nome
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            // Set HTTP-Only Cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: false, // Local HTTP
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            const roleFormatted = user.perfil.toLowerCase();
            const roleLabel = user.perfil === 'DIRECAO' ? 'Direção' : user.perfil === 'NUTRICIONISTA' ? 'Nutricionista' : 'Aluno';

            return res.json({
                mensagem: 'Login realizado com sucesso',
                usuario: {
                    id: String(user.id_usuario),
                    name: user.nome,
                    cpf: user.cpf,
                    email: user.email,
                    role: roleFormatted,
                    roleLabel: roleLabel,
                    status: user.status ? 'Ativo' : 'Inativo',
                    createdAt: new Date(user.data_cadastro).toLocaleDateString('pt-BR'),
                    schoolYear: user.ano_escolar || undefined,
                    dietaryRestriction: user.restricoes || (roleFormatted === 'aluno' ? 'Sem restrição' : undefined)
                }
            });

        } catch (error) {
            console.error('Erro no login:', error);
            return res.status(500).json({ erro: 'Erro interno ao realizar login' });
        }
    }

    async logout(req, res) {
        res.clearCookie('token');
        return res.json({ mensagem: 'Logout realizado com sucesso' });
    }

    async me(req, res) {
        try {
            const token = req.cookies?.token || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);

            if (!token) {
                return res.status(401).json({ erro: 'Não autenticado' });
            }

            const decoded = jwt.verify(token, JWT_SECRET);

            const [users] = await pool.query(
                `SELECT u.*, GROUP_CONCAT(r.nome_restricao SEPARATOR ', ') as restricoes
                 FROM usuarios u
                 LEFT JOIN usuario_restricao ur ON u.id_usuario = ur.id_usuario
                 LEFT JOIN restricoes_alimentares r ON ur.id_restricao = r.id_restricao
                 WHERE u.id_usuario = ?
                 GROUP BY u.id_usuario`,
                [decoded.id_usuario]
            );

            if (users.length === 0 || !users[0].status) {
                res.clearCookie('token');
                return res.status(401).json({ erro: 'Sessão inválida ou usuário inativo' });
            }

            const user = users[0];
            const roleFormatted = user.perfil.toLowerCase();
            const roleLabel = user.perfil === 'DIRECAO' ? 'Direção' : user.perfil === 'NUTRICIONISTA' ? 'Nutricionista' : 'Aluno';

            return res.json({
                usuario: {
                    id: String(user.id_usuario),
                    name: user.nome,
                    cpf: user.cpf,
                    email: user.email,
                    role: roleFormatted,
                    roleLabel: roleLabel,
                    status: user.status ? 'Ativo' : 'Inativo',
                    createdAt: new Date(user.data_cadastro).toLocaleDateString('pt-BR'),
                    schoolYear: user.ano_escolar || undefined,
                    dietaryRestriction: user.restricoes || (roleFormatted === 'aluno' ? 'Sem restrição' : undefined)
                }
            });
        } catch (error) {
            res.clearCookie('token');
            return res.status(401).json({ erro: 'Sessão expirada' });
        }
    }
    
    async forgotPassword(req, res) {
        try {
            const { email, cpf } = req.body;

            if (!email || !cpf) {
                return res.status(400).json({
                    erro: 'Informe o e-mail e o CPF.'
                });
            }

            const emailNormalizado = email.toLowerCase().trim();
            const cpfNormalizado = String(cpf).replace(/\D/g, '');

            if (cpfNormalizado.length !== 11) {
                return res.status(400).json({
                    erro: 'Confira os dados informados.'
                });
            }

            const [users] = await pool.query(
                `SELECT id_usuario, email
                 FROM usuarios
                 WHERE LOWER(email) = ?
                 AND REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?
                 LIMIT 1`,
                [emailNormalizado, cpfNormalizado]
            );

            const resposta = {
                mensagem:
                    'Se os dados corresponderem a uma conta, a solicitação será processada.'
            };

            if (users.length === 0) {
                return res.json(resposta);
            }

            const user = users[0];

            // Invalida solicitações anteriores ainda não utilizadas.
            await pool.query(
                `UPDATE recuperacao_senha
                 SET utilizado = TRUE, data_utilizacao = NOW()
                 WHERE id_usuario = ? AND utilizado = FALSE`,
                [user.id_usuario]
            );

            // Gera um token aleatório e guarda somente seu hash.
            const token = randomBytes(32).toString('hex');

            const codigoHash = createHash('sha256')
                .update(token)
                .digest('hex');

            await pool.query(
                `INSERT INTO recuperacao_senha
                 (id_usuario, codigo, data_expiracao, utilizado)
                 VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE), FALSE)`,
                [user.id_usuario, codigoHash]
            );

            // Modo de teste: não envia e-mail.
            if (process.env.NODE_ENV !== 'production') {
                const frontendUrl =
                    process.env.FRONTEND_URL || 'http://localhost:5173';

                const link =
                    `${frontendUrl}/reset-password?token=${token}`;

                console.log('\n[TESTE DE RECUPERAÇÃO DE SENHA]');
                console.log(`Link temporário: ${link}\n`);
            }

            return res.json(resposta);
        } catch (error) {
            console.error('Erro ao solicitar recuperação:', error);

            return res.status(500).json({
                erro: 'Não foi possível processar a solicitação.'
            });
        }
    }

    async resetPassword(req, res) {
        let connection;

        try {
            const { token, password, novaSenha } = req.body;
            const senhaNova = password || novaSenha;

            if (!token || !senhaNova) {
                return res.status(400).json({
                    erro: 'Informe o token e a nova senha.'
                });
            }

            if (typeof senhaNova !== 'string' || senhaNova.length < 8) {
                return res.status(400).json({
                    erro: 'A nova senha deve ter pelo menos 8 caracteres.'
                });
            }

            const codigoHash = createHash('sha256')
                .update(token)
                .digest('hex');

            connection = await pool.getConnection();
            await connection.beginTransaction();

            const [recuperacoes] = await connection.query(
                `SELECT id_recuperacao, id_usuario
                 FROM recuperacao_senha
                 WHERE codigo = ?
                   AND utilizado = FALSE
                   AND data_expiracao > NOW()
                 LIMIT 1
                 FOR UPDATE`,
                [codigoHash]
            );

            if (recuperacoes.length === 0) {
                await connection.rollback();

                return res.status(400).json({
                    erro: 'Link inválido, expirado ou já utilizado.'
                });
            }

            const recuperacao = recuperacoes[0];

            const senhaHash = await bcrypt.hash(senhaNova, 10);

            await connection.query(
                `UPDATE usuarios
                 SET senha = ?
                 WHERE id_usuario = ?`,
                [senhaHash, recuperacao.id_usuario]
            );

            await connection.query(
                `UPDATE recuperacao_senha
                 SET utilizado = TRUE, data_utilizacao = NOW()
                 WHERE id_recuperacao = ?`,
                [recuperacao.id_recuperacao]
            );

            await connection.commit();

            return res.json({
                mensagem:
                    'Senha redefinida com sucesso. Você já pode entrar.'
            });
        } catch (error) {
            if (connection) {
                await connection.rollback();
            }

            console.error('Erro ao redefinir senha:', error);

            return res.status(500).json({
                erro: 'Não foi possível redefinir a senha.'
            });
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

}

export default new AuthController();
