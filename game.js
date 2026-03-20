// game.js - Online multiplayer tam sürüm

const socket = io();
let playerId;
let gameState;
let currentCity = 0;
let chart;

// Socket olayları
socket.on('init', data => {
    playerId = data.playerId;
    gameState = data.gameState;
    renderCities();
    render();
});

socket.on('update', data => {
    gameState = data;
    render();
});

socket.on('news', text => {
    alert(text);
});

// EKRANI ÇİZER
function render() {
    if(!gameState.players[playerId]) return;

    let player = gameState.players[playerId];
    document.getElementById("money").innerText = player.money;

    let city = gameState.cities[currentCity];

    // Ürünler
    let html = `<h3>Şehir: ${city.name}</h3>`;
    let products = ["Elma","Ekmek","Su"];
    products.forEach((p,index)=>{
        let price = city.prices[index];
        html += `<div>
            ${p} - ${price} ₺ (Stok: ${player.inventory[index]})
            <button onclick="buy(${index})">Al</button>
            <button onclick="sell(${index})">Sat</button>
        </div>`;
    });
    document.getElementById("products").innerHTML = html;

    // Oyuncu paneli
    let playersHtml = '';
    for(const id in gameState.players){
        let p = gameState.players[id];
        playersHtml += `<div style="color:${p.color}; border:1px solid ${p.color}; padding:2px; margin:2px;">
            ${p.name} - Para: ${p.money} ₺ | Stok: ${p.inventory.join(', ')}
            ${id===playerId ? "(Sen)" : ""}
        </div>`;
    }
    document.getElementById("players").innerHTML = playersHtml;

    // Grafik
    drawChart();
}

// Şehir butonları
function renderCities(){
    let html = '';
    gameState.cities.forEach((c,index)=>{
        html+=`<button onclick="changeCity(${index})">${c.name}</button>`;
    });
    document.getElementById("cities").innerHTML=html;
}

function changeCity(index){
    currentCity=index;
    render();
}

// Al / Sat işlemleri
function buy(index){
    socket.emit('buy',{productIndex:index,city:currentCity});
}
function sell(index){
    socket.emit('sell',{productIndex:index,city:currentCity});
}

// Grafik fonksiyonu (Chart.js)
function drawChart(){
    let city = gameState.cities[currentCity];
    let products = ["Elma","Ekmek","Su"];

    let datasets = products.map((p,i)=>({
        label: p,
        data: city.history[i],
        borderColor: i===0?'red':i===1?'green':'blue',
        fill:false
    }));

    if(chart) chart.destroy();
    let ctx = document.getElementById('priceChart').getContext('2d');
    chart = new Chart(ctx,{
        type:'line',
        data:{labels:Array(city.history[0].length).fill(''),datasets},
        options:{animation:false,responsive:false,plugins:{legend:{position:'bottom'}}}
    });
}