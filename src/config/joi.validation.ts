import * as Joi from 'joi';

export const JoiValidationSchema = Joi.object({
    NODE_ENV: Joi.string().valid('dev', 'prod', 'test').default('dev'),
    PORT: Joi.number().default(3000),
    DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),
    DB_NAME: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    STAR_WARS_API_URL: Joi.string().uri().required(),
    ADMIN_EMAIL: Joi.string().email().required(),
    ADMIN_PASSWORD: Joi.string().min(6).max(50).required(),
    ADMIN_FULLNAME: Joi.string().min(2).required(),
});