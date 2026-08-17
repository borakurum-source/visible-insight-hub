/** Bizi tercih eden markalarin logolari (CDN asset pointer'lari). */

import atoAnkaraTicaretOdasi from "@/assets/logos/ato-ankara-ticaret-odasi.png.asset.json";
import kpmg from "@/assets/logos/kpmg.png.asset.json";
import fuga from "@/assets/logos/fuga.png.asset.json";
import sarizeybek from "@/assets/logos/sarizeybek.png.asset.json";
import istanbulBilgiUniversitesi from "@/assets/logos/istanbul-bilgi-universitesi.png.asset.json";
import bauBahcesehir from "@/assets/logos/bau-bahcesehir.png.asset.json";
import avivasa from "@/assets/logos/avivasa.png.asset.json";
import farmasi from "@/assets/logos/farmasi.png.asset.json";
import isiklar from "@/assets/logos/isiklar.png.asset.json";
import peEnergy from "@/assets/logos/pe-energy.png.asset.json";
import bilgeadamAkademi from "@/assets/logos/bilgeadam-akademi.png.asset.json";
import oneAndZero from "@/assets/logos/one-and-zero.png.asset.json";
import quietBlue from "@/assets/logos/quiet-blue.png.asset.json";
import veniceSwap from "@/assets/logos/venice-swap.png.asset.json";
import fikirmod from "@/assets/logos/fikirmod.png.asset.json";
import faselis from "@/assets/logos/faselis.png.asset.json";
import simpleLivingEco from "@/assets/logos/simple-living-eco.png.asset.json";
import maslife from "@/assets/logos/maslife.png.asset.json";
import hicretCam from "@/assets/logos/hicret-cam.png.asset.json";
import enkronos from "@/assets/logos/enkronos.png.asset.json";
import hypatia from "@/assets/logos/hypatia.png.asset.json";
import bookingCom from "@/assets/logos/booking-com.png.asset.json";
import azraKohen from "@/assets/logos/azra-kohen.png.asset.json";
import filmfolk from "@/assets/logos/filmfolk.png.asset.json";
import bkiw from "@/assets/logos/bkiw.png.asset.json";
import secretBrokerage from "@/assets/logos/secret-brokerage.png.asset.json";
import voicecrafters from "@/assets/logos/voicecrafters.png.asset.json";

export type ClientLogo = { name: string; src: string };

export const CLIENT_LOGOS: ClientLogo[] = [
  { name: "Ankara Ticaret Odası", src: atoAnkaraTicaretOdasi.url },
  { name: "KPMG", src: kpmg.url },
  { name: "Fuga", src: fuga.url },
  { name: "Sarızeybek Şirketler Grubu", src: sarizeybek.url },
  { name: "İstanbul Bilgi Üniversitesi", src: istanbulBilgiUniversitesi.url },
  { name: "Bahçeşehir Üniversitesi", src: bauBahcesehir.url },
  { name: "AvivaSA", src: avivasa.url },
  { name: "Farmasi", src: farmasi.url },
  { name: "Işıklar", src: isiklar.url },
  { name: "PE Energy", src: peEnergy.url },
  { name: "BilgeAdam Akademi", src: bilgeadamAkademi.url },
  { name: "one&zero", src: oneAndZero.url },
  { name: "Quiet Blue", src: quietBlue.url },
  { name: "Venice Swap", src: veniceSwap.url },
  { name: "fikirmod", src: fikirmod.url },
  { name: "faselis", src: faselis.url },
  { name: "Simple Living Eco", src: simpleLivingEco.url },
  { name: "maslife", src: maslife.url },
  { name: "Hicret Cam", src: hicretCam.url },
  { name: "Enkronos", src: enkronos.url },
  { name: "Hypatia", src: hypatia.url },
  { name: "Booking.com", src: bookingCom.url },
  { name: "Yazar Azra Kohen", src: azraKohen.url },
  { name: "FilmFolk", src: filmfolk.url },
  { name: "BKIW", src: bkiw.url },
  { name: "Secret Brokerage", src: secretBrokerage.url },
  { name: "VoiceCrafters", src: voicecrafters.url },
];
