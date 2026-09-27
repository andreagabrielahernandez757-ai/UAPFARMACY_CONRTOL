# Pharmacy Watch

Aplicación para monitoreo de tiempos de entrega de medicamentos

Crear una aplicación compatible con computadoras, tabletas y teléfonos móviles para medir el tiempo que tarda farmacia en entregar medicamentos a los pacientes.

Registro del paciente

Campos obligatorios:

* Número de ticket.

* Nombre del paciente.

* Farmacia donde se realizó el registro:

    * Farmacia de enfermedades comunes.

    * Farmacia especializada.

    * Farmacia central.

* Hora de ingreso (automática).

Botón: “Iniciar espera”.

Monitoreo en tiempo real

Mostrar un dashboard con la siguiente información:

* Ticket.

* Nombre del paciente.

* Farmacia.

* Hora de ingreso.

* Tiempo transcurrido.

Sistema de alertas visuales

El estado del paciente debe cambiar automáticamente según el tiempo de espera:

* 🟢 Verde: dentro del tiempo establecido.

* 🟡 Amarillo: próximo a vencer el tiempo.

* 🔴 Rojo: tiempo excedido.

No es necesario emitir sonidos; únicamente alertas visuales mediante colores.

Finalización

Agregar un botón llamado “Medicamento entregado” para finalizar el registro y guardar automáticamente el tiempo total de espera.

Dashboard y estadísticas

Mostrar:

* Pacientes atendidos.

* Pacientes en espera.

* Tiempo promedio de entrega.

* Tiempo máximo y mínimo de espera.

* Cantidad de pacientes fuera del tiempo establecido.

* Estadísticas por farmacia y por día.

La interfaz debe ser moderna, intuitiva y optimizada para uso hospitalario.

El diseño debe parecer una pantalla de monitoreo de aeropuerto, con información grande, colores llamativos, actualización en tiempo real y una visualización clara desde cualquier dispositivo.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://speedy-queue-monitor.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c33da5b1-0079-446d-b800-15f7fb5d5ec5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
