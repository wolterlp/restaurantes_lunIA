import butterChicken from '../assets/images/butter-chicken-4.jpg';
import palakPaneer from '../assets/images/Saag-Paneer-1.jpg';
import biryani from '../assets/images/hyderabadibiryani.jpg';
import masalaDosa from '../assets/images/masala-dosa.jpg';
import choleBhature from '../assets/images/chole-bhature.jpg';
import rajmaChawal from '../assets/images/rajma-chawal-1.jpg';
import paneerTikka from '../assets/images/paneer-tika.webp';
import gulabJamun from '../assets/images/gulab-jamun.webp';
import pooriSabji from '../assets/images/poori-sabji.webp';
import roganJosh from '../assets/images/rogan-josh.jpg';
import { color } from 'framer-motion';

export const popularDishes = [
    {
      id: 1,
      image: butterChicken,
      name: 'Pollo a la Mantequilla',
      numberOfOrders: 250,
    },
    {
      id: 2,
      image: palakPaneer,
      name: 'Palak Paneer',
      numberOfOrders: 190,
    },
    {
      id: 3,
      image: biryani,
      name: 'Hyderabadi Biryani',
      numberOfOrders: 300,
    },
    {
      id: 4,
      image: masalaDosa,
      name: 'Masala Dosa',
      numberOfOrders: 220,
    },
    {
      id: 5,
      image: choleBhature,
      name: 'Chole Bhature',
      numberOfOrders: 270,
    },
    {
      id: 6,
      image: rajmaChawal,
      name: 'Rajma Chawal',
      numberOfOrders: 180,
    },
    {
      id: 7,
      image: paneerTikka,
      name: 'Paneer Tikka',
      numberOfOrders: 210,
    },
    {
      id: 8,
      image: gulabJamun,
      name: 'Gulab Jamun',
      numberOfOrders: 310,
    },
    {
      id: 9,
      image: pooriSabji,
      name: 'Poori Sabji',
      numberOfOrders: 140,
    },
    {
      id: 10,
      image: roganJosh,
      name: 'Rogan Josh',
      numberOfOrders: 160,
    },
  ];


export const tables = [
    { id: 1, name: "Mesa 1", status: "Ocupada", initial: "AM", seats: 4 },
    { id: 2, name: "Mesa 2", status: "Disponible", initial: "MB", seats: 6 },
    { id: 3, name: "Mesa 3", status: "Ocupada", initial: "JS", seats: 2 },
    { id: 4, name: "Mesa 4", status: "Disponible", initial: "HR", seats: 4 },
    { id: 5, name: "Mesa 5", status: "Ocupada", initial: "PL", seats: 3 },
    { id: 6, name: "Mesa 6", status: "Disponible", initial: "RT", seats: 4 },
    { id: 7, name: "Mesa 7", status: "Ocupada", initial: "LC", seats: 5 },
    { id: 8, name: "Mesa 8", status: "Disponible", initial: "DP", seats: 5 },
    { id: 9, name: "Mesa 9", status: "Ocupada", initial: "NK", seats: 6 },
    { id: 10, name: "Mesa 10", status: "Disponible", initial: "SB", seats: 6 },
    { id: 11, name: "Mesa 11", status: "Ocupada", initial: "GT", seats: 4 },
    { id: 12, name: "Mesa 12", status: "Disponible", initial: "JS", seats: 6 },
    { id: 13, name: "Mesa 13", status: "Ocupada", initial: "EK", seats: 2 },
    { id: 14, name: "Mesa 14", status: "Disponible", initial: "QN", seats: 6 },
    { id: 15, name: "Mesa 15", status: "Ocupada", initial: "TW", seats: 3 }
  ];
  
export const startersItem = [
    {
      id: 1,
      name: "Paneer Tikka",
      price: 250,
      category: "Vegetariano"
    },
    {
      id: 2,
      name: "Chicken Tikka",
      price: 300,
      category: "No Vegetariano"
    },
    {
      id: 3,
      name: "Tandoori Chicken",
      price: 350,
      category: "No Vegetariano"
    },
    {
      id: 4,
      name: "Samosa",
      price: 100,
      category: "Vegetariano"
    },
    {
      id: 5,
      name: "Aloo Tikki",
      price: 120,
      category: "Vegetariano"
    },
    {
      id: 6,
      name: "Hara Bhara Kebab",
      price: 220,
      category: "Vegetariano"
    }
  ];
  
export const mainCourse = [
  {
    id: 1,
    name: "Butter Chicken",
    price: 400,
    category: "No Vegetariano"
  },
  {
    id: 2,
    name: "Paneer Butter Masala",
    price: 350,
    category: "Vegetariano"
  },
  {
    id: 3,
    name: "Chicken Biryani",
    price: 450,
    category: "No Vegetariano"
  },
  {
    id: 4,
    name: "Dal Makhani",
    price: 180,
    category: "Vegetariano"
  },
  {
    id: 5,
    name: "Kadai Paneer",
    price: 300,
    category: "Vegetariano"
  },
  {
    id: 6,
    name: "Rogan Josh",
    price: 500,
    category: "No Vegetariano"
  }
];

export const beverages = [
  {
    id: 1,
    name: "Masala Chai",
    price: 50,
    category: "Caliente"
  },
  {
    id: 2,
    name: "Lemon Soda",
    price: 80,
    category: "Frío"
  },
  {
    id: 3,
    name: "Mango Lassi",
    price: 120,
    category: "Frío"
  },
  {
    id: 4,
    name: "Cold Coffee",
    price: 150,
    category: "Frío"
  },
  {
    id: 5,
    name: "Fresh Lime Water",
    price: 60,
    category: "Frío"
  },
  {
    id: 6,
    name: "Iced Tea",
    price: 100,
    category: "Frío"
  }
];

export const soups = [
  {
    id: 1,
    name: "Sopa de Tomate",
    price: 120,
    category: "Vegetariano"
  },
  {
    id: 2,
    name: "Sopa de Maíz Dulce",
    price: 130,
    category: "Vegetariano"
  },
  {
    id: 3,
    name: "Sopa Agridulce",
    price: 140,
    category: "Vegetariano"
  },
  {
    id: 4,
    name: "Sopa Clara de Pollo",
    price: 160,
    category: "No Vegetariano"
  },
  {
    id: 5,
    name: "Sopa de Champiñones",
    price: 150,
    category: "Vegetariano"
  },
  {
    id: 6,
    name: "Sopa de Limón y Cilantro",
    price: 110,
    category: "Vegetariano"
  }
];

export const desserts = [
  {
    id: 1,
    name: "Gulab Jamun",
    price: 100,
    category: "Vegetariano"
  },
  {
    id: 2,
    name: "Kulfi",
    price: 150,
    category: "Vegetariano"
  },
  {
    id: 3,
    name: "Pastel de Lava de Chocolate",
    price: 250,
    category: "Vegetariano"
  },
  {
    id: 4,
    name: "Ras Malai",
    price: 180,
    category: "Vegetariano"
  }
];

export const pizzas = [
  {
    id: 1,
    name: "Pizza Margarita",
    price: 350,
    category: "Vegetariano"
  },
  {
    id: 2,
    name: "Pizza Suprema Vegetariana",
    price: 400,
    category: "Vegetariano"
  },
  {
    id: 3,
    name: "Pizza de Pepperoni",
    price: 450,
    category: "No Vegetariano"
  }
];

export const alcoholicDrinks = [
  {
    id: 1,
    name: "Cerveza",
    price: 200,
    category: "Alcohólico"
  },
  {
    id: 2,
    name: "Whiskey",
    price: 500,
    category: "Alcohólico"
  },
  {
    id: 3,
    name: "Vodka",
    price: 450,
    category: "Alcohólico"
  },
  {
    id: 4,
    name: "Ron",
    price: 350,
    category: "Alcohólico"
  },
  {
    id: 5,
    name: "Tequila",
    price: 600,
    category: "Alcohólico"
  },
  {
    id: 6,
    name: "Cóctel",
    price: 400,
    category: "Alcohólico"
  }
];

export const salads = [
  {
    id: 1,
    name: "Ensalada César",
    price: 200,
    category: "Vegetariano"
  },
  {
    id: 2,
    name: "Ensalada Griega",
    price: 250,
    category: "Vegetariano"
  },
  {
    id: 3,
    name: "Ensalada de Frutas",
    price: 150,
    category: "Vegetariano"
  },
  {
    id: 4,
    name: "Ensalada de Pollo",
    price: 300,
    category: "No Vegetariano"
  },
  {
    id: 5,
    name: "Ensalada de Atún",
    price: 350,
  
  }
];


export const menus = [
  { id: 1, name: "Entradas", bgColor: "#b73e3e" ,icon: "🍲", items: startersItem },
  { id: 2, name: "Plato Principal", bgColor: "#5b45b0" ,icon: "🍛", items: mainCourse },
  { id: 3, name: "Bebidas", bgColor: "#7f167f" ,icon: "🍹", items: beverages },
  { id: 4, name: "Sopas", bgColor: "#735f32" ,icon: "🍜", items: soups },
  { id: 5, name: "Postres", bgColor: "#1d2569" ,icon: "🍰", items: desserts },
  { id: 6, name: "Pizzas", bgColor: "#285430" ,icon: "🍕", items: pizzas },
  { id: 7, name: "Bebidas Alcohólicas", bgColor: "#b73e3e" ,icon: "🍺", items: alcoholicDrinks },
  { id: 8, name: "Ensaladas", bgColor: "#5b45b0" ,icon: "🥗", items: salads }
]

export const metricsData = [
  { title: "Ingresos", value: "$50,846.90", percentage: "12%", color: "#025cca", isIncrease: false },
  { title: "Clics Salientes", value: "10,342", percentage: "16%", color: "#02ca3a", isIncrease: true },
  { title: "Total Clientes", value: "19,720", percentage: "10%", color: "#f6b100", isIncrease: true },
  { title: "Conteo de Eventos", value: "20,000", percentage: "10%", color: "#be3e3f", isIncrease: false },
];

export const itemsData = [
  { title: "Categorías Totales", value: "8", percentage: "12%", color: "#5b45b0", isIncrease: false },
  { title: "Platillos Totales", value: "50", percentage: "12%", color: "#285430", isIncrease: true },
  { title: "Pedidos Activos", value: "12", percentage: "12%", color: "#735f32", isIncrease: true },
  { title: "Mesas Totales", value: "10", color: "#7f167f"}
];

export const orders = [
  {
    id: "101",
    customer: "Amrit Raj",
    status: "Ready",
    dateTime: "January 18, 2025 08:32 PM",
    items: 8,
    tableNo: 3,
    total: 250.0,
  },
  {
    id: "102",
    customer: "John Doe",
    status: "In Progress",
    dateTime: "January 18, 2025 08:45 PM",
    items: 5,
    tableNo: 4,
    total: 180.0,
  },
  {
    id: "103",
    customer: "Emma Smith",
    status: "Ready",
    dateTime: "January 18, 2025 09:00 PM",
    items: 3,
    tableNo: 5,
    total: 120.0,
  },
  {
    id: "104",
    customer: "Chris Brown",
    status: "In Progress",
    dateTime: "January 18, 2025 09:15 PM",
    items: 6,
    tableNo: 6,
    total: 220.0,
  },
];