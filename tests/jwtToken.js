const jwt = require('jsonwebtoken');
const {jwtConfig} = require('../project.json')
try{
    jwt.verify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6InVzZXJfMSIsImlkZW50aXR5Ijp7InJvbGUiOiJBZG1pbiIsImlkZW50aXR5IjoiRW50ZXJwcmlzZVVzZXIifSwiaWF0IjoxNjM0ODY4NDk5LCJleHAiOjE2MzQ4NzIwOTl9.Z2iaEiIKtK_VYWijkti2jZh0aej0YC3sDGeS9UKJC20', jwtConfig.secret)
} catch(e){
    console.log(e)
}