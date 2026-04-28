import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { assets, prices } from "@/config/assets";
import { CalendarDays, CreditCard, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <Image
          src={assets.hero}
          alt="Club Deportivo Minvu Serviu"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Reservas Club Deportivo Minvu Serviu
          </h1>
          <p className="text-lg md:text-xl mb-8 text-white/90">
            Reserva tu cancha deportiva de forma fácil, rápida y segura. 
            Disfruta de nuestras instalaciones de primer nivel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reservar">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8">
                Reservar Ahora
              </Button>
            </Link>
            <Link href="/calendario">
              <Button size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white/10 px-8">
                Ver Disponibilidad
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">¿Cómo funciona?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm">
              <CalendarDays className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Elige tu horario</h3>
              <p className="text-muted-foreground">
                Selecciona la cancha, fecha y bloques de 1 hora que necesites.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm">
              <CreditCard className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Realiza el pago</h3>
              <p className="text-muted-foreground">
                Sube tu comprobante de transferencia o paga con tarjeta (próximamente).
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm">
              <ShieldCheck className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Recibe confirmación</h3>
              <p className="text-muted-foreground">
                Te notificaremos por correo cuando tu reserva sea aprobada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Courts & Prices */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Nuestras Canchas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {prices.map((item) => (
              <div key={item.court} className="bg-white rounded-xl overflow-hidden shadow-sm border flex flex-col">
                <div className="relative h-48">
                  <Image src={item.image} alt={item.court} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-xl font-semibold mb-2">{item.court}</h3>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">{item.description}</p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Socio</span>
                      <span className="text-xl font-bold text-primary">
                        ${item.priceMember.toLocaleString("es-CL")}
                        <span className="text-sm font-normal text-muted-foreground">/hr</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">No socio</span>
                      <span className="text-xl font-bold text-foreground">
                        ${item.priceNonMember.toLocaleString("es-CL")}
                        <span className="text-sm font-normal text-muted-foreground">/hr</span>
                      </span>
                    </div>
                  </div>
                  <Link href="/reservar">
                    <Button className="w-full">Reservar</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-20 px-4 bg-muted">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Nuestras Instalaciones</h2>
          <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
            Contamos con 1 cancha de fútbol 11, 2 canchas de tenis profesionales y 1 gimnasio polideportivo
            preparado para baby fútbol, básquetbol y voleibol.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="relative h-80 rounded-xl overflow-hidden">
              <Image src={assets.canchaFutbol} alt="Cancha de fútbol" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div className="relative h-80 rounded-xl overflow-hidden">
              <Image src={assets.gimnasio} alt="Gimnasio polideportivo" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-primary text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">¿Listo para jugar?</h2>
          <p className="text-lg mb-8 text-white/90">
            Regístrate gratis y comienza a reservar tu cancha en minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white text-white bg-transparent hover:bg-white/10 px-8">
                Crear Cuenta
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 px-8">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground border-t">
        <p>© {new Date().getFullYear()} Club Deportivo Minvu Serviu. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
