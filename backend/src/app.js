const express = require('express');
const morgan = require('morgan');

const security = require('./config/security');
const corsConfig = require('./config/cors');
const { apiRateLimit, loginRateLimit } = require('./middlewares/rateLimit.middleware');
const notFoundMiddleware = require('./middlewares/notFound.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const authRoutes = require('./features/auth/auth.routes');
const albumsRoutes = require('./features/albums/albums.routes');
const imagesRoutes = require('./features/images/images.routes');
const usersRoutes = require('./features/users/users.routes');

const app = express();

app.use(security);
app.use(corsConfig);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/api', apiRateLimit);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', loginRateLimit, authRoutes);
app.use('/api/albums', albumsRoutes.publicRouter);
app.use('/api/images', imagesRoutes.publicRouter);
app.use('/api/admin/albums', albumsRoutes.adminRouter);
app.use('/api/admin', imagesRoutes.adminRouter);
app.use('/api/admin/users', usersRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
