import Image from "next/image";
import formatPrice from "@/utils/priceFormat";
import { ProductType } from "@/types/ProductType";
import Link from "next/link";

const Product = ({
  name,
  image,
  unit_amount,
  id,
  description,
  metadata,
}: ProductType) => {
  const { features } = metadata;
  return (
    <Link
      href={{
        pathname: `/products/${id}`,
        query: { name, image, unit_amount, id, description, features },
      }}
    >
      <div className="text-gray-700">
        <Image
          src={image}
          alt={name}
          width={800}
          height={800}
          className="w-96 h-96 object-cover rounded-lg"
        />
        <div className="font-medium py-2">
          <h1>{name}</h1>
          <h2 className="text-sm text-teal-700">
            {unit_amount && formatPrice(unit_amount as number)}
          </h2>
        </div>
      </div>
    </Link>
  );
};

export default Product;
