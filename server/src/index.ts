import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { config } from 'dotenv';
import UserModel from './models/User';
import CatModel from './models/Cat';
import RegistrationCodeModel, { IRegistrationCode } from './models/RegistrationCode';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import PhotoModel from './models/Photo';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import PublishUserModel from './models/PublishUser';
import MessageModel from './models/Message';
import { setupSwagger } from './swaggerConfig';

config();
export { app };
const PORT = 5500;
const app = express();
setupSwagger(app);

app.use(cors());
app.use(express.json());
const secretKey = 'mySecretKey123';
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
// 身份验证中间件
const authenticate = (req: Request, res: Response, next: any) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: '未提供身份验证凭据' });
  }

  jwt.verify(token, secretKey, (err: any, decoded: any) => {
    if (err) {
      // Check if the error is related to invalid token format
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ error: '无效的身份验证凭据', message: err.message });
      }

      // Check if the error is related to token expiration
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ error: '身份验证凭据已过期', message: err.message });
      }

      // For other types of errors, return the error message
      return res.status(403).json({ error: '身份验证失败', message: err.message });
    }

    req.user = decoded; // 将解码的用户信息添加到请求对象中
    next();
  });
};


const storage = multer.diskStorage({
  destination: 'uploads/', // 设置上传文件的保存目录
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, 'cat-' + uniqueSuffix + fileExtension); // 设置上传文件的保存文件名
  }
});

const upload = multer({ storage });





/**
 * @swagger
 * /users:
 *   post:
 *     summary: 注册用户
 *     description: 创建新用户并保存
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               registrationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: 成功创建用户
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: 无效的注册代码
 *       500:
 *         description: 内部服务器错误
 */
// 注册用户
app.post('/users', async (req: Request, res: Response) => {
  try {
    const { username, password, registrationCode } = req.body;

    // 验证用户的其他信息...

    // 检查注册代码是否存在且未被使用
    const codeExists = await RegistrationCodeModel.exists({ code: registrationCode });
    if (!codeExists) {
      return res.status(400).json({ error: 'Invalid registration code' });
    }

    // 获取注册代码模型
    const registrationCodeModel: IRegistrationCode | null = await RegistrationCodeModel.findOne({ code: registrationCode });

    // 检查注册代码是否存在且未被使用
    if (!registrationCodeModel || registrationCodeModel.used) {
      return res.status(400).json({ error: 'Invalid or already used registration code' });
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户并保存
    const newUser = new UserModel({
      username,
      password: hashedPassword,
      usedRegistrationCodes: [registrationCode], // 添加使用过的注册代码到数组中
    });
    const createdUser = await newUser.save();

    // 将注册代码标记为已使用
    registrationCodeModel.used = true;
    await registrationCodeModel.save();

    res.json(createdUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});
/**
 * @swagger
 * /register/public-users:
 *   post:
 *     summary: 注册公众用户账户
 *     description: 创建新的公众用户账户
 *     tags:
 *       - Public Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: 成功创建用户账户
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: 用户名或邮箱已存在
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: 发生错误
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 error:
 *                   type: string
 */
// 注册公众用户账户
app.post('/register/public-users', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // 验证用户的其他信息...

    // 检查用户名是否已存在
    const existingUser = await PublishUserModel.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // 检查邮箱是否已存在
    const existingEmail = await PublishUserModel.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户并保存
    const newUser = new PublishUserModel({
      username,
      email,
      password: hashedPassword,
    });
    const createdUser = await newUser.save();

    res.json(createdUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});
/**
 * @swagger
 * /public-users/{userId}/favorites:
 *   post:
 *     summary: 添加收藏
 *     description: 将猫添加到用户的收藏夹
 *     tags:
 *       - Public Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: 用户ID
 *         schema:
 *           type: string
 *       - in: body
 *         name: body
 *         required: true
 *         description: 请求体参数
 *         schema:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *           required:
 *             - _id
 *     responses:
 *       200:
 *         description: 成功将猫添加到收藏夹
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       400:
 *         description: 猫已在收藏夹中或请求参数无效
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: 用户或猫未找到
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: 发生错误
 *         content:
 *           application/json:
 *             schema:
 *               properties:
 *                 error:
 *                   type: string
 */
// 添加收藏
app.post('/public-users/:userId/favorites', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { _id } = req.body;

    // 检查用户是否存在
    const user = await PublishUserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 检查猫是否存在
    const cat = await CatModel.findById(_id);
    if (!cat) {
      return res.status(404).json({ error: 'Cat not found' });
    }

    // 检查猫是否已经在用户的收藏夹中
    if (user.favoriteCats.includes(_id)) {
      return res.status(400).json({ error: 'Cat already in favorites' });
    }

    // 将猫添加到用户的收藏夹
    user.favoriteCats.push(_id);
    await user.save();

    res.json(user.favoriteCats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


app.get('/public-users/:userId/favorites', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    // 检查用户是否存在
    const user = await PublishUserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 获取用户收藏夹中的猫，并填充照片字段
    const favoriteCats = await CatModel.find({ _id: { $in: user.favoriteCats } }).populate('photos');

    // 提取第一张照片的 URL 并添加到猫对象中
    const populatedCats = favoriteCats.map(cat => {
      const imageUrl = cat.photos.length > 0 ? cat.photos[0].url : '';
      return { ...cat.toObject(), imageUrl };
    });

    res.json(populatedCats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});



app.delete('/public-users/:userId/favorites/:catId', authenticate, async (req, res) => {
  try {
    const { userId, catId } = req.params;

    // 检查用户是否存在
    const user = await PublishUserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 从用户的收藏夹中移除猫
    const updatedFavorites = user.favoriteCats.filter(cat => cat.toString() !== catId);
    user.favoriteCats = updatedFavorites;
    await user.save();

    res.json(user.favoriteCats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/messages', authenticate, async (req, res) => {
  try {
    const { userId, content } = req.body;

    // 检查发送者是否存在
    const sender = await PublishUserModel.findById(userId);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // 创建新消息
    const message = new MessageModel({
      sender: sender._id,
      content
    });
    await message.save();

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/messages/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if the user exists
    const user = await PublishUserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch messages for the user
    const messages = await MessageModel.find({ sender: userId });

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


app.get('/getmessages', authenticate, async (req, res) => {
  try {
    // Fetch all messages
    const messages = await MessageModel.find();

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.post('/messages/reply', authenticate, async (req, res) => {
  try {
    const { messageId, replyContent } = req.body;

    // 檢查消息是否存在
    const message = await MessageModel.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // 檢查是否有權限回覆訊息（例如慈善機構）
    const sender = await PublishUserModel.findById(message.sender);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // 儲存回覆訊息內容
    message.replied = true;
    message.replyContent = replyContent;
    await message.save();

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


app.put('/messages/reply/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { replyContent } = req.body;

    // 检查消息是否存在
    const message = await MessageModel.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // 检查是否有权限更改回复信息（例如慈善机构）
    const sender = await PublishUserModel.findById(message.sender);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // 更新回复信息内容
    message.replyContent = replyContent;
    await message.save();

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


app.delete('/messages/reply/:messageId', authenticate, async (req, res) => {
  try {
    const { messageId } = req.params;

    // 检查消息是否存在
    const message = await MessageModel.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // 检查是否有权限删除回复信息（例如慈善机构）
    const sender = await PublishUserModel.findById(message.sender);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }

    // 删除回复信息
    message.replied = false;
    message.replyContent = undefined;
    await message.save();

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});





// 用户登录
app.post('/login/public-users', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // 检查用户名是否存在
    const user = await PublishUserModel.findOne({ username });

    if (!user || !(user.password && await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: '无效的用户名或密码' });
    }

    // 创建 JWT 令牌
    const token = jwt.sign({ userId: user._id }, secretKey);

    // 在此处进行令牌验证

    // 令牌验证成功，返回成功消息和用户ID
    res.status(200).json({ message: '登录成功', token, _id: user._id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '登录过程中发生错误' });
  }
});





// 用户登录
app.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // 在这里执行验证逻辑，比如检查用户名和密码是否匹配数据库中的记录

    // 示例逻辑：假设有一个名为 User 的模型，用于存储用户信息
    const user = await UserModel.findOne({ username });

    if (!user || !(user.password && await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: '无效的用户名或密码' });
    }

    // 创建 JWT 令牌
    const token = jwt.sign({ userId: user._id }, secretKey);

    // 在此处进行令牌验证


      // 令牌验证成功，返回成功消息
      res.status(200).json({ message: '登录成功', token, _id: user._id});

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '登录过程中发生错误' });
  }
});


// 创建猫（需要授权）
app.post('/newcats', authenticate, upload.single('photo'), async (req, res) => {
  try {
    const { name, age, breed } = req.body;
    const { filename } = req.file as { filename: string };

    // 创建新猫的记录
    const newCat = new CatModel({
      name,
      age,
      breed,
      photos: [] // 初始化为空数组
    });

    // 保存新猫的记录到数据库
    const createdCat = await newCat.save();

    // 创建新照片记录
    const newPhoto = new PhotoModel({
      cat: createdCat._id,
      url: `uploads/${filename}`,
      description: '' // 可根据需要添加照片描述字段
    });

    // 保存新照片记录到数据库
    const createdPhoto = await newPhoto.save();

    // 将照片的 URL 添加到猫的 `photos` 数组中
    createdCat.photos.push(createdPhoto);
    await createdCat.save();

    res.json(createdCat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});


// 更新猫的信息（需要授权）
app.put('/catslist/edit/:id', authenticate, upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, age, breed } = req.body as { name: string, age: number, breed: string };
    const { file } = req; // 获取上传的文件

    const updatedCat = await CatModel.findById(id);

    if (!updatedCat) {
      return res.status(404).json({ error: 'Cat not found' });
    }

    // 更新猫的基本信息
    updatedCat.name = name;
    updatedCat.age = age;
    updatedCat.breed = breed;

    if (file) {
      // 如果选择了新的图片，则更新猫的照片信息
      // 创建新照片记录
      const newPhoto = new PhotoModel({
        cat: updatedCat._id,
        url: `uploads/${file.filename}`, // 修改URL路径
        description: '' // 可根据需要添加照片描述字段
      });

      // 保存新照片记录到数据库
      const createdPhoto = await newPhoto.save();

      // 删除旧的照片记录

      // 更新猫的照片信息
      updatedCat.photos = [createdPhoto];
    }

    // 保存更新后的猫信息
    const savedCat = await updatedCat.save();

    res.json(savedCat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});




// 删除猫的信息（需要授权）
app.delete('/catslist/delete/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedCat = await CatModel.findByIdAndRemove(id);

    if (!deletedCat) {
      return res.status(404).json({ error: 'Cat not found' });
    }

    // 删除相关照片信息
    await PhotoModel.deleteMany({ cat: deletedCat._id });

    res.json({ message: 'Cat deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// 获取所有猫的信息
app.get('/catslist', async (req, res) => {
  try {
    const cats = await CatModel.find().populate('photos'); // 对 `photos` 字段进行填充
    const populatedCats = cats.map(cat => {
      const imageUrl = cat.photos.length > 0 ? `${cat.photos[0].url}` : ''; // 获取第一张照片的 URL
      return { ...cat.toObject(), imageUrl }; // 将照片的 URL 添加到猫对象中
    });
    res.json(populatedCats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.use('/uploads', express.static('uploads'));


// 生成注册代码（需要授权）
app.post('/registration-codes', authenticate, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    const registrationCode = new RegistrationCodeModel({ code });
    const savedCode = await registrationCode.save();

    res.json(savedCode);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});





mongoose
  .connect(process.env.MONGO_URL!)
  .then(() => {
    console.log(`listening on port ${PORT}`);
    app.listen(PORT);
  });



  

