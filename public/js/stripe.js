import axios from "axios";
import Stripe from "stripe";
import { showAlert } from "./alert";

/* eslint-disable */
const stripe = Stripe(
  "pk_test_51RWuPDITxC0Z4LRoJL2gQtVOedTMBNJhAs1Crxh6cvmFIkRQVUrjIjG5OaPcxgIMx8DcuXWp7SHd0sCFiaRkebnE00X4Fh3PZb"
);

export const bookTour = async (tourId) => {
  try {
    //1)Get chechout seesion from API
    const session = await axios(
      `127.1.1.0:3000/api/v1/booking/checkout-seeion/${tourId}`
    );

    //2)Create checkout form + charge the credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert("error", err);
  }
};
