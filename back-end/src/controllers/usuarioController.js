import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

class UsuarioController {
    // GET /usuarios
    async index(req, res) {
        try {
            const [rows] = await pool.query(
                `SELECT u.id_usuario, u.nome, u.cpf, u.email, u.perfil, u.status, u.data_cadastro, u.ano_escolar,
                        GROUP_CONCAT(r.nome_restricao SEPARATOR ', ') as restricoes
                 FROM usuarios u
                 LEFT JOIN usuario_restricao ur ON u.id_usuario = ur.id_usuario
                 LEFT JOIN restricoes_alimentares r ON ur.id_restricao = r.id_restricao
                 GROUP BY u.id_usuario
                 ORDER BY u.id_usuario DESC`
            );

            const formattedUsers = rows.map(user => {
                const roleFormatted = user.perfil.toLowerCase();
                const roleLabel = user.perfil === 'DIRECAO' ? 'Direção' : user.perfil === 'NUTRICIONISTA' ? 'Nutricionista' : 'Aluno';
                return {
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
                };
            });

            return res.json(formattedUsers);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            return res.status(500).json({ erro: 'Erro ao buscar usuários' });
        }
    }

    // POST /usuarios/aluno
    async createStudent(req, res) {
        try {
            const { name, cpf, email, password, schoolYear, dietaryRestriction } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
            }

            const emailNormalizado = email.toLowerCase().trim();
            const cleanCpf = (cpf || `000${Date.now()}`).replace(/\D/g, '').slice(0, 11).padStart(11, '0');

            const [existing] = await pool.query('SELECT id_usuario FROM usuarios WHERE email = ? OR cpf = ?', [emailNormalizado, cleanCpf]);
            if (existing.length > 0) {
                return res.status(400).json({ erro: 'Já existe um usuário cadastrado com este E-mail ou CPF.' });
            }

            const senhaHash = await bcrypt.hash(password, 10);
            const [result] = await pool.query(
                `INSERT INTO usuarios (nome, cpf, email, senha, perfil, ano_escolar, status)
                 VALUES (?, ?, ?, ?, 'ALUNO', ?, TRUE)`,
                [name, cleanCpf, emailNormalizado, senhaHash, schoolYear || '1º ano']
            );

            const userId = result.insertId;

            // Save dietary restriction if provided and not "Sem restrição"
            if (dietaryRestriction && dietaryRestriction !== 'Sem restrição') {
                let [restRows] = await pool.query('SELECT id_restricao FROM restricoes_alimentares WHERE LOWER(nome_restricao) = ?', [dietaryRestriction.toLowerCase()]);
                let restrId;
                if (restRows.length === 0) {
                    const [rRes] = await pool.query('INSERT INTO restricoes_alimentares (nome_restricao) VALUES (?)', [dietaryRestriction]);
                    restrId = rRes.insertId;
                } else {
                    restrId = restRows[0].id_restricao;
                }
                await pool.query('INSERT INTO usuario_restricao (id_usuario, id_restricao) VALUES (?, ?)', [userId, restrId]);
            }

            return res.status(201).json({
                mensagem: 'Aluno cadastrado com sucesso!',
                user: {
                    id: String(userId),
                    name,
                    cpf: cleanCpf,
                    email: emailNormalizado,
                    role: 'aluno',
                    roleLabel: 'Aluno',
                    status: 'Ativo',
                    createdAt: new Date().toLocaleDateString('pt-BR'),
                    schoolYear: schoolYear || '1º ano',
                    dietaryRestriction: dietaryRestriction || 'Sem restrição'
                }
            });
        } catch (error) {
            console.error('Erro ao cadastrar aluno:', error);
            return res.status(500).json({ erro: 'Erro ao cadastrar aluno' });
        }
    }

    // POST /usuarios/nutricionista
    async createNutritionist(req, res) {
        try {
            const { name, cpf, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
            }

            const emailNormalizado = email.toLowerCase().trim();
            const cleanCpf = (cpf || `000${Date.now()}`).replace(/\D/g, '').slice(0, 11).padStart(11, '0');

            const [existing] = await pool.query('SELECT id_usuario FROM usuarios WHERE email = ? OR cpf = ?', [emailNormalizado, cleanCpf]);
            if (existing.length > 0) {
                return res.status(400).json({ erro: 'Já existe um usuário cadastrado com este E-mail ou CPF.' });
            }

            const senhaHash = await bcrypt.hash(password, 10);
            const [result] = await pool.query(
                `INSERT INTO usuarios (nome, cpf, email, senha, perfil, status)
                 VALUES (?, ?, ?, ?, 'NUTRICIONISTA', TRUE)`,
                [name, cleanCpf, emailNormalizado, senhaHash]
            );

            return res.status(201).json({
                mensagem: 'Nutricionista cadastrada com sucesso!',
                user: {
                    id: String(result.insertId),
                    name,
                    cpf: cleanCpf,
                    email: emailNormalizado,
                    role: 'nutricionista',
                    roleLabel: 'Nutricionista',
                    status: 'Ativo',
                    createdAt: new Date().toLocaleDateString('pt-BR')
                }
            });
        } catch (error) {
            console.error('Erro ao cadastrar nutricionista:', error);
            return res.status(500).json({ erro: 'Erro ao cadastrar nutricionista' });
        }
    }
    
    // PUT /usuarios/:id
   async update(req, res) {
        try {

            const { id } = req.params;

            const {
                name,
                cpf,
                email,
                schoolYear,
                role,
                dietaryRestriction,
                password
            } = req.body;


            // Verificar se o usuário existe
            const [users] = await pool.query(
                `SELECT id_usuario
                 FROM usuarios
                 WHERE id_usuario = ?`,
                [id]
            );

            if (users.length === 0) {
                return res.status(404).json({
                    erro: 'Usuário não encontrado'
                });
            }


            // Normalizar dados
            const emailNormalizado = email
                ? email.toLowerCase().trim()
                : undefined;

            const cleanCpf = cpf
                ? cpf.replace(/\D/g, '').slice(0, 11)
                : undefined;


            // Verificar se CPF ou email já pertencem a OUTRO usuário
            if (emailNormalizado || cleanCpf) {

                const [existing] = await pool.query(
                    `SELECT id_usuario
                     FROM usuarios
                     WHERE (email = ? OR cpf = ?)
                     AND id_usuario <> ?`,
                    [
                        emailNormalizado || '',
                        cleanCpf || '',
                        id
                    ]
                );

                if (existing.length > 0) {
                    return res.status(400).json({
                        erro: 'Já existe outro usuário cadastrado com este E-mail ou CPF.'
                    });
                }
            }


            // Converter perfil do front-end para o formato do banco
            let perfilBanco;

            if (role) {
                perfilBanco = role.toUpperCase();

                const perfisValidos = [
                    'ALUNO',
                    'NUTRICIONISTA',
                    'DIRECAO'
                ];

                if (!perfisValidos.includes(perfilBanco)) {
                    return res.status(400).json({
                        erro: 'Perfil de usuário inválido.'
                    });
                }
            }


            // Atualizar dados principais
            await pool.query(
                `UPDATE usuarios
                 SET
                    nome = COALESCE(?, nome),
                    cpf = COALESCE(?, cpf),
                    email = COALESCE(?, email),
                    ano_escolar = COALESCE(?, ano_escolar),
                    perfil = COALESCE(?, perfil)
                 WHERE id_usuario = ?`,
                [
                    name || null,
                    cleanCpf || null,
                    emailNormalizado || null,
                    schoolYear || null,
                    perfilBanco || null,
                    id
                ]
            );


            // Se uma nova senha foi enviada, atualizar senha
            if (password && password.trim() !== '') {

                const senhaHash = await bcrypt.hash(password, 10);

                await pool.query(
                    `UPDATE usuarios
                     SET senha = ?
                     WHERE id_usuario = ?`,
                    [senhaHash, id]
                );
            }


            // Atualizar restrição alimentar
            if (dietaryRestriction !== undefined) {

                // Remover restrição anterior
                await pool.query(
                    `DELETE FROM usuario_restricao
                     WHERE id_usuario = ?`,
                    [id]
                );


                // Se não for "Sem restrição", cadastrar a nova
                if (
                    dietaryRestriction &&
                    dietaryRestriction !== 'Sem restrição'
                ) {

                    let [restRows] = await pool.query(
                        `SELECT id_restricao
                         FROM restricoes_alimentares
                         WHERE LOWER(nome_restricao) = ?`,
                        [dietaryRestriction.toLowerCase()]
                    );

                    let restrId;

                    if (restRows.length === 0) {

                        const [rRes] = await pool.query(
                            `INSERT INTO restricoes_alimentares
                                (nome_restricao)
                             VALUES (?)`,
                            [dietaryRestriction]
                        );

                        restrId = rRes.insertId;

                    } else {

                        restrId = restRows[0].id_restricao;

                    }

                    await pool.query(
                        `INSERT INTO usuario_restricao
                            (id_usuario, id_restricao)
                         VALUES (?, ?)`,
                        [id, restrId]
                    );
                }
            }


            // Buscar usuário atualizado
            const [updatedRows] = await pool.query(
                `SELECT
                    u.id_usuario,
                    u.nome,
                    u.cpf,
                    u.email,
                    u.perfil,
                    u.status,
                    u.data_cadastro,
                    u.ano_escolar,
                    GROUP_CONCAT(
                        r.nome_restricao
                        SEPARATOR ', '
                    ) AS restricoes
                 FROM usuarios u
                 LEFT JOIN usuario_restricao ur
                    ON u.id_usuario = ur.id_usuario
                 LEFT JOIN restricoes_alimentares r
                    ON ur.id_restricao = r.id_restricao
                 WHERE u.id_usuario = ?
                 GROUP BY u.id_usuario`,
                [id]
            );


            const user = updatedRows[0];

            return res.json({
                mensagem: 'Usuário atualizado com sucesso!',
                user: {
                    id: String(user.id_usuario),
                    name: user.nome,
                    cpf: user.cpf,
                    email: user.email,
                    role: user.perfil.toLowerCase(),
                    roleLabel:
                        user.perfil === 'DIRECAO'
                            ? 'Direção'
                            : user.perfil === 'NUTRICIONISTA'
                                ? 'Nutricionista'
                                : 'Aluno',
                    status: user.status ? 'Ativo' : 'Inativo',
                    createdAt: new Date(
                        user.data_cadastro
                    ).toLocaleDateString('pt-BR'),
                    schoolYear: user.ano_escolar || undefined,
                    dietaryRestriction:
                        user.restricoes ||
                        (user.perfil === 'ALUNO'
                            ? 'Sem restrição'
                            : undefined)
                }
            });

        } catch (error) {

            console.error('Erro ao atualizar usuário:', error);

            return res.status(500).json({
                erro: 'Erro ao atualizar usuário'
            });
        }
    }



    // PATCH /usuarios/:id/status
    async toggleStatus(req, res) {
        try {
            const { id } = req.params;
            const [rows] = await pool.query('SELECT status FROM usuarios WHERE id_usuario = ?', [id]);
            if (rows.length === 0) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }

            const newStatus = !rows[0].status;
            await pool.query('UPDATE usuarios SET status = ? WHERE id_usuario = ?', [newStatus, id]);

            return res.json({ mensagem: 'Status alterado com sucesso', status: newStatus ? 'Ativo' : 'Inativo' });
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            return res.status(500).json({ erro: 'Erro ao alterar status do usuário' });
        }
    }

}

export default new UsuarioController();
