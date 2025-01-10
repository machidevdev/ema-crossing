import Taapi from 'taapi';


const taapi = new Taapi(process.env.TAAPI_API_KEY!);
taapi.setDefaultExchange("binance");

export default taapi;