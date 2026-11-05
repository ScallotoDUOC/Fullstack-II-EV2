# Microservicio de Pagos

Gestiona el pago de un pedido: lo inicia, registra el comprobante cuando es por transferencia, lo confirma o reembolsa, y permite consultar su estado.

- Package base: `juegaYa.Pagos`
- API REST con Spring Boot, ruta base `/pagos`
- Almacenamiento **en memoria** (los datos se pierden al reiniciar)

## Estructura

```
juegaYa.Pagos
├── config/        PagoConfig               Registra repository y service como beans
├── controller/    PagoController           Endpoints REST
├── dto/           PagoDTO                  Respuesta (con ComprobanteDTO anidado)
│                  IniciarPagoRequest, ComprobanteRequest, EstadoPagoDTO
├── exception/     GlobalExceptionHandler   Convierte excepciones en respuestas JSON
│                  PagoNoEncontradoException, EstadoPagoInvalidoException, ErrorResponse
├── model/         Pago, ComprobanteTransferencia, MetodoPago, EstadoPago
├── repository/    PagoRepository           Persistencia en memoria
└── service/       PagoService              Logica de aplicacion
```

Flujo de una peticion: `Controller` → `Service` → `Repository`, trabajando sobre las clases del `model`.

## Como funciona

### Modelo

- **Pago**: asociado a un `pedidoId` y un `usuarioId`, con `montoTotal`, `metodo` (`TRANSFERENCIA` o `TARJETA`), `estado`, `referenciaExterna` y `fecha`.
- **ComprobanteTransferencia**: respaldo de un pago por transferencia (`banco`, `numeroOperacion`, `archivoUrl`). Se marca como verificado cuando el pago se confirma.

### Estados del pago

```
PENDIENTE ──confirmar──▶ APROBADO ──reembolsar──▶ REEMBOLSADO
    └──rechazar──▶ RECHAZADO
```

`rechazar` existe en el modelo, pero todavia no esta expuesto en el service ni en la API.

### Flujo por metodo de pago

**Transferencia**
1. `POST /pagos` con metodo `TRANSFERENCIA` → pago `PENDIENTE`.
2. `POST /pagos/{id}/comprobante` con banco y numero de operacion. El numero de operacion pasa a ser la `referenciaExterna`.
3. `PUT /pagos/{id}/confirmar` → pago `APROBADO` y comprobante verificado. Sin comprobante registrado no se puede confirmar.

**Tarjeta**
1. `POST /pagos` con metodo `TARJETA` → pago `PENDIENTE`.
2. `PUT /pagos/{id}/confirmar` → pago `APROBADO`, con una referencia generada (`REF-XXXXXXXX`). La integracion con una pasarela real no esta implementada.

### Reglas

- El monto debe ser mayor a 0 y el metodo es obligatorio.
- Un pedido no puede tener un segundo pago mientras el anterior este `PENDIENTE` o `APROBADO`. Si fue `RECHAZADO` o `REEMBOLSADO`, se puede iniciar otro.
- Solo los pagos por transferencia llevan comprobante, y solo mientras estan `PENDIENTE`.
- Solo se puede reembolsar un pago `APROBADO`.

## Endpoints

| Metodo | Ruta | Descripcion | Respuesta |
|---|---|---|---|
| POST | `/pagos` | Inicia un pago | 201 |
| POST | `/pagos/{id}/comprobante` | Registra el comprobante de una transferencia | 201 |
| PUT | `/pagos/{id}/confirmar` | Aprueba el pago | 200 |
| PUT | `/pagos/{id}/reembolsar` | Reembolsa un pago aprobado | 200 |
| GET | `/pagos/pedido/{pedidoId}/estado` | Estado del pago de un pedido | 200 |

### Ejemplos

Iniciar un pago:

```bash
curl -X POST http://localhost:8084/pagos \
  -H "Content-Type: application/json" \
  -d '{ "pedidoId": 1, "usuarioId": 1, "montoTotal": 41000, "metodo": "TRANSFERENCIA" }'
```

Registrar el comprobante:

```bash
curl -X POST http://localhost:8084/pagos/1/comprobante \
  -H "Content-Type: application/json" \
  -d '{ "banco": "Banco Estado", "numeroOperacion": "987654", "archivoUrl": "https://ejemplo.cl/comprobante.pdf" }'
```

Confirmar, reembolsar y consultar estado:

```bash
curl -X PUT http://localhost:8084/pagos/1/confirmar
curl -X PUT http://localhost:8084/pagos/1/reembolsar
curl http://localhost:8084/pagos/pedido/1/estado
```

Respuesta de un pago:

```json
{
  "id": 1,
  "pedidoId": 1,
  "usuarioId": 1,
  "montoTotal": 41000,
  "metodo": "TRANSFERENCIA",
  "estado": "APROBADO",
  "referenciaExterna": "987654",
  "fecha": "2026-10-19T10:15:30",
  "comprobante": { "pagoId": 1, "banco": "Banco Estado", "numeroOperacion": "987654", "archivoUrl": "https://ejemplo.cl/comprobante.pdf", "verificado": true }
}
```

Respuesta de estado:

```json
{ "pedidoId": 1, "estado": "APROBADO" }
```

## Errores

```json
{ "fecha": "2026-10-19T10:15:30", "status": 409, "error": "Conflict", "mensaje": "La transferencia no tiene comprobante registrado" }
```

| Codigo | Cuando |
|---|---|
| 400 | Datos invalidos (monto menor o igual a 0, metodo faltante o invalido, cuerpo ilegible) |
| 404 | El pago no existe, o el pedido no tiene pago |
| 409 | La operacion no corresponde al estado del pago |
| 500 | Error inesperado (el detalle no se expone) |

## Como usarlo

### Requisitos

- Java 11 o superior (17 recomendado)
- Maven o Gradle
- Dependencia `spring-boot-starter-web`

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```

### Ejecucion

1. Copia los packages dentro de `src/main/java/juegaYa/Pagos/`.
2. Crea la clase principal con `@SpringBootApplication` en `juegaYa.Pagos`.
3. Define un puerto distinto al del microservicio de Pedidos en `application.properties`:

```properties
server.port=8082
```

4. Inicia con `mvn spring-boot:run` (o `./gradlew bootRun`).

## Limitaciones actuales

- No hay integracion con una pasarela de pago real para tarjetas.
- No hay endpoint para rechazar un pago, aunque el modelo lo soporta; el motivo del rechazo tampoco se guarda.
- No esta conectado con el microservicio de Pedidos: al aprobar un pago, nadie avisa al pedido.
- `montoTotal` y `usuarioId` los envia el cliente sin verificar contra Pedidos.
- Los datos viven en memoria; para produccion falta una base de datos, autenticacion y validaciones de entrada.
