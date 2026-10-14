"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
export default function ThemeToggle(){
 const [dark,setDark]=useState(false);
 useEffect(()=>{const saved=localStorage.getItem("nexus-theme");const isDark=saved==="dark";setDark(isDark);document.documentElement.dataset.theme=isDark?"dark":"light";},[]);
 function toggle(){const next=!dark;setDark(next);document.documentElement.dataset.theme=next?"dark":"light";localStorage.setItem("nexus-theme",next?"dark":"light");}
 return <button className="theme-toggle" onClick={toggle} title={dark?"Mudar para tema claro":"Mudar para tema escuro"} aria-label={dark?"Mudar para tema claro":"Mudar para tema escuro"}>{dark?<Sun size={18}/>:<Moon size={18}/>}<span>{dark?"Tema claro":"Tema escuro"}</span></button>;
}
