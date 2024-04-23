"use client";
import { useCartStore } from "@/store";
import { AddCartType } from "@/types/AddCartType";

const AddCart = ({ name, image, id, quantity, unit_amount }: AddCartType) => {
  const cartStore = useCartStore();
  return (
    <>
      <button
        onClick={() =>
          cartStore.addProduct({ id, image, unit_amount, quantity, name })
        }
        className="my-12 text-white py-2 px-6 font-medium rounded-md bg-teal-700"
      >
        Add to cart
      </button>
    </>
  );
};

export default AddCart;
