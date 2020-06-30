const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const newG = require('./globby').newIOServer;
const delayStartBlocker = require('./blockers').delayStartBlocker


app.use('/static', express.static('public'))


function Dice(sides){
    this.sides = sides;

    this.roll = function(){
        return this.sides[Math.floor(Math.random() * this.sides.length)]
    }
}

function battleFunction(state){
    let pl1Power = 0;
    let pl2Power = 0;

    state.pl1Dices.forEach((dice) => {
        const side = dice.roll();
        if(!side.effect || side.effect == 'normal'){
            pl1Power += side.value;
        }
    })

    state.pl2Dices.forEach((dice) => {
        const side = dice.roll();
        if(!side.effect || side.effect == 'normal'){
            pl2Power += side.value;
        }
    })

    if(pl1Power > pl2Power){
        state.player1Health -= pl1Power - pl2Power;
    }
    else if(pl2Power > pl1Power){
        state.player2Health -= pl2Power - pl1Power;
    }

    state.player1Played = false;
    state.player2Played = false;

}

function pickDice(move,state,player){
    state[player + 'Dices'].push(state.dicesToPick[move]);
    state.dicesToPick.splice(move,1);
}

function giveDiceOptions(){
    const dices =[
                    [{value:1},{value:2},{value:3},{value:4},{value:5},{value:6}],
                    [{value:4},{value:4},{value:4},{value:4},{value:4},{value:1}],
                    [{value:3},{value:3},{value:3},{value:3},{value:3},{value:6}],
                    [{value:0},{value:0},{value:1},{value:5},{value:5},{value:10}],
                 ] 
    
    return JSON.parse(JSON.stringify(dices));
    //return [...dices[Math.floor(Math.random() * dices.length)]]
}

function checkIfBattleTime(state){
    if(state.player1Played && state.player2Played){
        if(state.firstToPlay == 'player1'){
            state.firstToPlay = 'player2'
        }
        else{
            state.firstToPlay = 'player1';
        }
        return true;
    }
    else{
        return false;
    }
}

function isYourTurn(state,player){
    if(state[player+'Played'] == true || (state.firstToPlay != player && !state.player1Played && !state.player2Played)){
        return false;
    }
    else{
        return true;
    }
}

function moveFunction(state,player,move){
    if(state.dicesToPick.length === 0){
        console.log(giveDiceOptions)
        state.dicesToPick = giveDiceOptions()
    }
    if(!isYourTurn(state,player)){
        return;
    }
    pickDice(move, state,player);

    checkIfBattleTime(state)
    if(state.player1Played && state.player2Played){
        battleFunction(state);
    }
}

newG({
    baseState: {
        player1Dices:[],
        player2Dices:[],
        player1Health:100,
        player2Health :100,
        dicesToPick:giveDiceOptions(),
        player1Played: false,
        player2Played: false,
        firstToPlay:'player1'
        //Starting State
    },
    moveFunction: function (player, move, state) {
        moveFunction(state,player.ref,move);
    },
    maxPlayers: 2, 
    statePresenter: function (state, playerRef) {

        return state;
    },
    connectFunction: function (state, playerRef) {
   
    },
    disconnectFunction: function (state, playerRef) {
    }
},
    io)


app.get('/', function (req, res) {
    return res.status(200).sendFile(__dirname + '/exampleBasic.html');
});


http.listen(3000, function () {
    console.log('listening on *:3000');
});