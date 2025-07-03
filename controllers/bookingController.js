const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Tour = require("../Models/tourModel");
const Booking = require("../Models/bookingModel");
const User = require("../Models/userModel");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) get the currently booked tour

  const tour = await Tour.findById(req.params.tourId);

  //2) Create the checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `${req.protocol}://${req.get("host")}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
    customer_email: req.user.email,
    //we get access to the customer email on req.user because it is also a protected route
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          unit_amount: tour.price * 100,
          currency: "usd",
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://natours.dev/img/tours/${tour.imageCover}`],
          },
        },

        quantity: 1,
      },
    ],
  });

  //3) send to the client
  res.status(200).json({
    status: "success",
    session,
  });
});

exports.createBookingCheckout = async (session) => {
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email })).id;
  const price = session.display_items[0].amount / 100;
  await Booking.create({ tour, user, price });
};

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBooking = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
