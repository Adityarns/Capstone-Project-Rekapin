/**
 * ============================================================
 *    REKAPIN — Team Member Data
 *    src/data/teamData.js
 *
 *    Static data for the /support (Our Team) page.
 *    Each member has a unique avatarColor for the placeholder
 *    and a cardVariant that controls the wave background.
 * ============================================================
 *
 * @format
 */

import rozzanImg from "../assets/team/rozzan.jpeg";
import zulfanImg from "../assets/team/zulfan.jpeg";
import irfanImg from "../assets/team/irfan.jpeg";
import adityaImg from "../assets/team/aditya.jpeg";
import rafiImg from "../assets/team/rafi.jpeg";
import ziyadulImg from "../assets/team/ziyadul.jpeg";

export const teamMembers = [
  {
    id: "t-1",
    name: "Rozzan Izaz Ramadhani",
    role: "AI Engineer",
    university: "Universitas Indonesia",
    initials: "RR",
    avatarColor: "#8B6F47",
    cardVariant: "olive",
    avatarSrc: rozzanImg,
  },
  {
    id: "t-4",
    name: "Irfan Yusra Athallah",
    role: "Data Scientist",
    university: "Universitas Padjadjaran",
    initials: "IA",
    avatarColor: "#8E7A6B",
    cardVariant: "olive",
    avatarSrc: irfanImg,
  },
  {
    id: "t-2",
    name: "Rafi Fadhil Amanullah",
    role: "Full-Stack Web Developer",
    university: "Universitas Pamulang",
    initials: "RA",
    avatarColor: "#6B4A7A",
    cardVariant: "olive-pink",
    avatarSrc: rafiImg,
  },
  {
    id: "t-3",
    name: "Zulfan Al-Zahwan Putra Ashadi",
    role: "AI Engineer",
    university: "UIN Sunan Gunung Djati",
    initials: "ZA",
    avatarColor: "#6B8E6B",
    cardVariant: "pink",
    avatarSrc: zulfanImg,
  },
  {
    id: "t-5",
    name: "Ziyadul Quwwah Ahmad Yasin",
    role: "Data Scientist",
    university: "UIN Sunan Gunung Djati",
    initials: "ZY",
    avatarColor: "#7A6B8E",
    cardVariant: "olive-pink",
    avatarSrc: ziyadulImg,
  },
  {
    id: "t-6",
    name: "Aditya Rahman Syach",
    role: "Full-Stack Web Developer",
    university: "UIN Sunan Gunung Djati",
    initials: "AS",
    avatarColor: "#4A7A6B",
    cardVariant: "pink",
    avatarSrc: adityaImg,
  },
];

/**
 * Role badge styling config.
 * Maps role string → CSS class suffix.
 */
export const roleBadgeMap = {
  "AI Engineer": "maroon",
  "Data Scientist": "olive",
  "Full-Stack Web Developer": "gradient",
};
