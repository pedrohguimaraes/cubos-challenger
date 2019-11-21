const express = require('express')
const router = express.Router()
const fs = require('fs')
const archive = JSON.parse(fs.readFileSync('files/content.json', "utf8"))
const moment = require('moment')

router.get('/', async(req, res) => {
    
    try{
        // valida se há regra
        if(archive.length < 1){
            throw 'Nenhuma regra cadastrada'
        }

        const retorno = JSON.stringify(archive)
        
       return res.status(200).send(retorno)
    }catch(err){
        
        return res.status(400).send(err)
    }
})

router.post('/store', async(req, res) => {

    try{
        const postData = req.body   
        const start = moment(postData.intervals.start, 'hh:mm:ss')
        const end = moment(postData.intervals.end, 'hh:mm:ss')
    
        if(postData.day){

            if(archive.length > 0){
                archive.forEach((value) => {
                    const index = postData.day.indexOf(value.day)
        
                    // se já houver cadastro com a data enviada
                    if(index != -1){
                        
                        // filtro de conflito de horários
                        value.intervals.forEach((hour) => {
                            const hourStart = moment(hour.start, 'hh:mm:ss')
                            const hourEnd   = moment(hour.end, 'hh:mm:ss')
                            
                            if((start >= hourStart && start <= hourEnd) ||
                                (end >= hourStart && end <= hourEnd )){
                                throw `Intervalo para a data ${value.day} já preenchido`
                            }
                        })

                        // adiciona o intervalo à data já existente
                        value.intervals.push(postData.intervals)
        
                        // remove a data da request para sobrar somente os que não tem cadastro
                        postData.day.splice(index, 1)
                    }
                })  
            }

            // Adicionando os valores que não tem cadastro
            if(postData.day.length > 0){
                postData.day.forEach((day) => {
                    archive.push({"day": day, "intervals": [postData.intervals]})
                })
            }

        // Cadastro em todos os dias da semana
        }else{
            
            if(!postData.intervals){
                throw "Informe um intervalo"
            }
            // Contador de cadastro de intervalos
            let contCad = 0

            // Caso não exista data cadastrada, não é possível adicionar um intervalo
            if(archive.length == 0){
                throw 'Por favor, cadastre alguma data antes de adicionar intervalos.'
            }
    
            // Se houver, adiciona os intervalos a todas as datas cadastradas
            archive.forEach((value) => {

                // filtro de conflito de horários
                value.intervals.forEach((hour) => {
                    const hourStart = moment(hour.start, 'hh:mm:ss')
                    const hourEnd   = moment(hour.end, 'hh:mm:ss')
                        
                    if((start >= hourStart && start <= hourEnd) ||
                        (end >= hourStart && end <= hourEnd )){
                        throw `Intervalo para a data ${value.day} já preenchido`
                    }
                })

                // Cadastra os intervalos
                value.intervals.push(postData.intervals)
                contCad++
            })

            if(contCad == 0){
                throw "Nenhuma regra cadastrada, estes intervalos já estão preenchidos"
            }
        }    

        const retorno = JSON.stringify(archive)
    
        fs.writeFile('files/content.json', retorno, (err) =>{
            return err 
        })

       return res.status(200).send(retorno)
    }catch(err){
        
        return res.status(400).send(err)
    }
})

router.post('/check', async(req, res) => {

    try{

        const postData = req.body
        const dates = []
        const begin = moment(postData.begin, 'DD-MM-YYYY')
        const end = moment(postData.end, 'DD-MM-YYYY')
        const interval = { begin: begin, end: end}

        archive.forEach((value, key, arr) => {
            const day = moment(arr[key].day, 'DD-MM-YYYY')
            if(day >= interval.begin && day <= interval.end){
                dates.push(arr[key])
            } 
        })

        const retorno = JSON.stringify(dates)
        return res.status(200).send(retorno)

    }catch(err){
        
        return res.status(400).send(err)
    }
})

router.delete('/:id', async(req, res) => {

    try{
        archive.splice(req.params.id, 1)
        const retorno = JSON.stringify(archive)

        fs.writeFile('files/content.json', retorno, (err) =>{
            return err 
        })

        return res.status(200).send(retorno)
    }catch(err){
        
        return res.status(400).send(err)
    }
})
module.exports = app => app.use('/daily', router) 
