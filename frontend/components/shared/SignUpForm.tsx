"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deployAccountContract, generateStarkNetAddress } from "../../utils/starknetUtils";
import { mintSBT } from "../../utils/mintSBT";
import { splitStringToFeltArray } from "../../utils/splitString";
import { byteArrayFromString, stringFromByteArray } from "@/utils/byteArrayFromString";
import { ByteArray } from "starknet";
import { reconstructURI } from "@/utils/reconstructURI";


interface AddressDetails {
  privateKey: string;
  publicKey: string;
  accountAddress: string;
}

const SignUpForm = () => {
  const [fullName, setFullName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [starknetAddress, setStarknetAddress] = useState("");
  const [isStarknetAddressOpen, setIsStarknetAddressOpen] = useState(false);
  const router = useRouter();

  const [addressDetails, setAddressDetails] = useState<AddressDetails | null>(
    null
  );
  const [deployStatus, setDeployStatus] = useState<string | null>(null);

  const handleGenerateAddress = async () => {
    try {
      console.log("generateStarkNetAddress");
      const details = generateStarkNetAddress();
      console.log("details", details);
      setAddressDetails(details as AddressDetails);
      setDeployStatus(null);
      return details;
    } catch (error: unknown) {
      console.log("error", error);
      if (error instanceof Error) {
        setDeployStatus(`Erreur : ${error.message}`);
      } else {
        setDeployStatus("Une erreur inconnue s'est produite");
      }
    }
  };

  const handleDeployContract = async (addressDetails: AddressDetails) => {
    if (!addressDetails) return;
    try {
      setDeployStatus("Déploiement en cours...");
      console.log("handleDeployContract");
      const result: any = await deployAccountContract(
        addressDetails.privateKey,
        addressDetails.publicKey
      );
      console.log("result", result);
      setDeployStatus(
        `Contrat déployé avec succès ! Transaction hash : ${result.transactionHash}`
      );
      return addressDetails;
    } catch (error: unknown) {
      console.log("error", error);
      if (error instanceof Error) {
        setDeployStatus(`Erreur : ${error.message}`);
      } else {
        setDeployStatus("Une erreur inconnue s'est produite");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const addressDetails = await handleGenerateAddress();

    await handleDeployContract(addressDetails as AddressDetails);

    console.log("POST");
    if (!addressDetails) return;
    const objectToSend = JSON.stringify({
      fullName: fullName,
      userName: userName,
      profilePicture: "ytrezerty",
      email: email,
      password: password,
      accountAddress: addressDetails.accountAddress,
      publicKey: addressDetails.publicKey,
      privateKey: addressDetails.privateKey,
    })

    console.log("objectToSend", objectToSend);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: objectToSend,
    });

    if (response.ok) {

      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("userName", userName);
      formData.append("email", email);
      formData.append("accountAddress", addressDetails.accountAddress);

      const responseUpload = await fetch("/api/auth/upload", {
        method: "POST",
        body: formData,
      });

      if (!responseUpload.ok) {
        console.log("Error uploading file");
      }

      const dataUploaded = await responseUpload.json();
      console.log("dataUploaded", dataUploaded);

      try {
        await mintSBT(addressDetails.accountAddress, dataUploaded.metadataUrl);

      } catch (error) {
        console.log("error", error);
      }

      router.push("/");
    } else {
      const data = await response.json();
      setError(data.error || "Une erreur est survenue lors de l'inscription.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Créer un compte
        </h2>
        {/* Si vous avez une addresse starknet */}
        {/* <div className="flex items-center space-x-2">
          <p className="text-sm text-gray-600">
            Si vous avez une adresse Starknet, cliquez sur le bouton ci-dessous
            pour la saisir.
          </p>
          <button
            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            onClick={() => setIsStarknetAddressOpen(!isStarknetAddressOpen)}
          >
            {isStarknetAddressOpen ? "Fermer" : "Ouvrir"}
          </button>
        </div> */}

        {isStarknetAddressOpen && (
          <input
            type="text"
            placeholder="Addresse starknet"
            value={starknetAddress}
            onChange={(e) => setStarknetAddress(e.target.value)}
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm">
            <div className="mb-4">
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700"
              >
                Nom complet
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-gray-700"
              >
                Nom d'utilisateur
              </label>
              <input
                id="userName"
                name="userName"
                type="text"
                autoComplete="username"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Adresse e-mail
              </label>
              <input
                id="email-signup"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <input
                id="password-signup"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-black"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              S'inscrire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUpForm;
