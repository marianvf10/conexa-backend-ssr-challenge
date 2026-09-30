//creo una funcion para mapear las variables de entorno a un objeto de configuracion
export const EnvConfiguration = () => ({
  environment: process.env.NODE_ENV || 'dev',
  port: Number(process.env.PORT),
  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    db: process.env.DB_NAME,
  },
  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    fullname: process.env.ADMIN_FULLNAME,
  },
  jwtSecret: process.env.JWT_SECRET,
  starWarsApiUrl: process.env.STAR_WARS_API_URL,
});
