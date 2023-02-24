// Use the existing order data
const orders = require("../data/orders-data");

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function list(req, res, next) {
  res.json({ data: orders });
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order does not exist: ${orderId}`,
  });
}

function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({
      status: 400,
      message: `Must include a ${propertyName}`,
    });
  };
}

function checkDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!dishes || dishes.length === 0 || !Array.isArray(dishes)) {
    return next({
      status: 400,
      message: "ivalid value of dishes",
    });
  }
  next();
}

function quantityIsValidNumber(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  for (let dish of dishes) {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      !Number.isInteger(dish.quantity)
    ) {
      return next({
        status: 400,
        message: `quantity requires a valid number: ${dish.id}`
      });
    }
  }
  next();
}

function statusIsPending(req, res, next) {
  const orderToCheck = res.locals.order.status;
  if (orderToCheck === "pending") {
    return next();
  } else {
    next({
      status: 400,
      message: `Value of the 'status' property must be pending`,
    });
  }
}

function validateStatus(req, res, next) {
  const { data: { status} = {} } = req.body;
  const validStatus = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ];
  if(!validStatus.includes(status)) {
    return next({
      status: 400,
      message: `status is invalid: ${status}`
    });
  } else {
  next();
  }
}

function statusIsDelivered(req, res, next) {
  const orderToCheck = res.locals.order;
  if(orderToCheck === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  } else {
    next();
  }
}

function validateId(req, res, next) {
  const { orderId } = req.params;
  const {data: {id} = {} } = req.body;
  if(!id) {
    next();
  }
    if (id !== orderId) {
      next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`
      });
    } else {
      next();
    } 
  }

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function update(req, res) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } =
    req.body;
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishes;
  res.json({ data: foundOrder });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id === orderId);
  // if (index > -1) {
    orders.splice(index, 1);
  // }
  res.status(204).json({ data: orders });
}

module.exports = {
  list,

  read: [orderExists, read],

  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    checkDishes,
    quantityIsValidNumber,
    create,
  ],

  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    validateStatus,
    checkDishes,
    quantityIsValidNumber,
    validateId,
    statusIsDelivered,
    update,
  ],
  delete: [
    orderExists, 
    statusIsPending, 
    destroy,
  ]
};