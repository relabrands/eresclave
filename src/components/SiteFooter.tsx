import { Link } from "@tanstack/react-router";
import { Instagram, Facebook, Mail, MapPin, Heart } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-hero-gradient text-white mt-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 right-0 h-64 w-64 rounded-full bg-white/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-[color:var(--orange-warm)]/10 blur-3xl" />
      </div>

      <div className="container-tight relative py-14 grid gap-10 md:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-warm-gradient grid place-items-center font-black text-lg shadow-warm">E</div>
            <div>
              <p className="font-display font-black">Eres Clave</p>
              <p className="text-xs text-white/60">🇩🇴 Las Charcas · RD</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/75 max-w-xs leading-relaxed">
            Una iniciativa de Robinson Sánchez para impulsar a la juventud de Las Charcas.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <a href="#" aria-label="Instagram" className="h-9 w-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/25 transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Facebook" className="h-9 w-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/25 transition-colors">
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://wa.me/18095550100"
              aria-label="WhatsApp"
              className="h-9 w-9 grid place-items-center rounded-full bg-white/10 hover:bg-white/25 transition-colors text-sm"
            >
              💬
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <p className="text-sm font-bold text-white/90 mb-4">Navegación</p>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link to="/" className="hover:text-white transition-colors">Inicio</Link></li>
            <li><Link to="/donar" className="hover:text-white transition-colors">Donar útiles</Link></li>
            <li><Link to="/iniciativa" className="hover:text-white transition-colors">La iniciativa</Link></li>
            <li><Link to="/auth" className="hover:text-white transition-colors">Área de gestión</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-sm font-bold text-white/90 mb-4">Contacto</p>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <a href="mailto:hola@eresclave.org" className="hover:text-white transition-colors">hola@eresclave.org</a>
            </li>
            <li className="flex items-center gap-2">
              <span>💬</span>
              <a href="https://wa.me/18095550100" className="hover:text-white transition-colors">(809) 555-0100</a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>Las Charcas, RD</span>
            </li>
          </ul>
        </div>

        {/* CTA mini */}
        <div>
          <p className="text-sm font-bold text-white/90 mb-4">¿Listo para ayudar?</p>
          <p className="text-sm text-white/70 leading-relaxed mb-5">
            Cada pequeño aporte suma para que un joven llegue al aula con todo lo que necesita.
          </p>
          <Link
            to="/donar"
            className="group inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-warm-gradient text-white font-bold shadow-warm hover:shadow-glow hover:scale-105 transition-all duration-200 text-sm w-full justify-center"
          >
            <Heart className="h-4 w-4 group-hover:animate-pulse-heart" /> Donar ahora
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 relative">
        <div className="container-tight py-4 text-xs text-white/50 flex flex-col sm:flex-row gap-2 justify-between items-center">
          <p>© {new Date().getFullYear()} Eres Clave · Robinson Sánchez. Todos los derechos reservados.</p>
          <p>Hecho con cariño en Las Charcas, República Dominicana 🇩🇴</p>
        </div>
      </div>
    </footer>
  );
}
