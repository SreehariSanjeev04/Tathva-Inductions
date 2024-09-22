const Joi = require('joi');

const userSchemaValidation = Joi.object({
    name: Joi.string().min(3).max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    age: Joi.number().min(18).max(100).required()
})

const loginValidation = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
})

module.exports = {userSchemaValidation, loginValidation};