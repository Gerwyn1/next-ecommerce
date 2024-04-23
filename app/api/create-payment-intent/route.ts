import Stripe from "stripe";
import { NextApiRequest, NextApiResponse } from "next";
import { authOptions } from "@/utils/authOptions";
import { getServerSession } from "next-auth/next";
import { AddCartType } from "@/types/AddCartType";
import { PrismaClient } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2022-11-15",
});

const prisma = new PrismaClient();

const calculateOrderAmount = (items: AddCartType[]) => {
  const totalPrice = items.reduce((acc, item) => {
    return acc + item.unit_amount! * item.quantity!;
  }, 0);
  return totalPrice;
};

export const POST = async (
  request: any,
) => {
  // get user
  const userSession = await getServerSession(authOptions);

  // check if user logged in
  if (!userSession?.user) {
    return new Response(JSON.stringify({ message: "Not logged in" }), {
      status: 403,
    });
  }

  // Extract data from body
  const { items, payment_intent_id } = await request.json();

  // data necessary for order
  const orderData = {
    user: { connect: { id: userSession.user?.id } },
    amount: calculateOrderAmount(items),
    currency: "usd",
    status: "pending",
    paymentIntentID: payment_intent_id,
    products: {
      create: items.map((item) => ({
        name: item.name,
        description: item.description || null,
        unit_amount: parseFloat(item.unit_amount),
        image: item.image,
        quantity: item.quantity,
      })),
    },
  };

  // check if payment intent exist, update order
  if (payment_intent_id) {
    const current_intent = await stripe.paymentIntents.retrieve(
      payment_intent_id
    );
    if (current_intent) {
      const updated_intent = await stripe.paymentIntents.update(
        payment_intent_id,
        { amount: calculateOrderAmount(items) }
      );
      // fetch order with product ids
      const existing_order = await prisma.order.findFirst({
        where: { paymentIntentID: updated_intent.id },
        include: { products: true },
      });
      if (!existing_order) {
        return new Response(
          JSON.stringify({ message: "Invalid Payment Intent" }),
          { status: 400 }
        );
      }

      // Update Existing Order
      const updated_order = await prisma.order.update({
        where: { id: existing_order.id },
        data: {
          amount: calculateOrderAmount(items),
          products: {
            deleteMany: {},
            create: items.map((item) => ({
              name: item.name,
              description: item.description || null,
              unit_amount: parseFloat(item.unit_amount),
              image: item.image,
              quantity: item.quantity,
            })),
          },
        },
      });
      return new Response(JSON.stringify({ paymentIntent: updated_intent }), {
        status: 200,
      });
    }
  } else {
    // create new order with prisma
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculateOrderAmount(items),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
    });
    orderData.paymentIntentID = paymentIntent.id;
    const newOrder = await prisma.order.create({
      data: orderData,
    });
    return new Response(JSON.stringify({ paymentIntent }), { status: 200 });
  }
};

