// server.js
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let gameState = {
    cities: [
        { name: "İstanbul", prices: [12,25,6], history: [[12],[25],[6]], production: [{amount:1,cost:5},{amount:1,cost:3},{amount:1,cost:1}] },
        { name: "Ankara", prices: [8,18,4], history: [[8],[18],[4]], production: [{amount:1,cost:5},{amount:1,cost:3},{amount:1,cost:1}] },
        { name: "İzmir", prices: [10,22,5], history: [[10],[22],[5]], production: [{amount:1,cost:5},{amount:1,cost:3},{amount:1,cost:1}] }
    ],
    players: {} // { playerId: { money, inventory } }
};

const newsList = [
    { city:0, product:0, change:5, text:"İstanbul'da kuraklık → Elma pahalandı!" },
    { city:1, product:1, change:-3, text:"Ankara'da yeni fırın açıldı → Ekmek ucuzladı!" },
    { city:2, product:2, change:2, text:"İzmir’de su sıkıntısı → Su fiyatı arttı!" }
];

// Oyuncu bağlanınca
io.on('connection', socket => {
    console.log('Yeni oyuncu:', socket.id);

    if(!gameState.players[socket.id]) {
    const colors = ['red','green','blue','orange','purple','brown'];
    const color = colors[Math.floor(Math.random()*colors.length)];
    const name = "Oyuncu" + Math.floor(Math.random()*1000);
    gameState.players[socket.id] = { 
        money: 1000, 
        inventory: [0,0,0], 
        name, 
        color 
    };
}

    socket.emit('init', { gameState, playerId: socket.id });

    socket.on('buy', data => {
        const { productIndex, city } = data;
        let player = gameState.players[socket.id];
        let price = gameState.cities[city].prices[productIndex];
        if(player.money >= price){
            player.money -= price;
            player.inventory[productIndex]++;
            gameState.cities[city].prices[productIndex] += 1;
            io.emit('update', gameState);
        }
    });

    socket.on('sell', data => {
        const { productIndex, city } = data;
        let player = gameState.players[socket.id];
        if(player.inventory[productIndex] > 0){
            player.inventory[productIndex]--;
            let price = gameState.cities[city].prices[productIndex];
            player.money += price;
            gameState.cities[city].prices[productIndex] -= 1;
            if(gameState.cities[city].prices[productIndex]<1) gameState.cities[city].prices[productIndex]=1;
            io.emit('update', gameState);
        }
    });
});

// Otomatik üretim, NPC ve fiyat güncelle
setInterval(()=>{
    gameState.cities.forEach(city=>{
        // NPC ve rastgele fiyat
        city.prices.forEach((price,i)=>{
            let rnd=Math.random();
            if(price<10) city.prices[i]+=2;
            else if(price>20) city.prices[i]-=2;
            else if(rnd<0.5) city.prices[i]+=1;
            else city.prices[i]-=1;
            if(city.prices[i]<1) city.prices[i]=1;

            // Üretim
            city.history[i].push(city.prices[i]);
            if(city.history[i].length>20) city.history[i].shift();
        });
    });

    io.emit('update', gameState);
},3000);

// Haberler
setInterval(()=>{
    let news = newsList[Math.floor(Math.random()*newsList.length)];
    gameState.cities[news.city].prices[news.product] += news.change;
    io.emit('news', news.text);
},10000);
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log("Sunucu çalışıyor: " + PORT);
});
