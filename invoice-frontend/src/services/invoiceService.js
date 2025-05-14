// services/invoiceService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL + '/invoices';

export const getInvoices = () => axios.get(API_URL);
export const createInvoice = (data) => axios.post(API_URL, data);
