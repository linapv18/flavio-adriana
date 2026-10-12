# Adaptación del prototipo

Se aplicó el diseño del prototipo de puertas e inicio con cuenta regresiva a la copia local, conservando la configuración, las fotos y la paleta elegidas.

## Rutas

- `/`: invitación con puertas animadas; un enlace personal válido muestra nombre y cupos reales.
- `/?abierta=1`: inicio con carrusel, cuenta regresiva, resumen de respuesta y accesos a las secciones.
- `/programa`: ceremonia y ubicación.
- `/rsvp`: confirmación real por invitación/familia mediante el endpoint existente.
- `/nuestra-historia`, `/faqs`: historia y preguntas desplegables.
- `/viaje-alojamiento`: alojamiento y turismo conservados.
- `/detalles`: regalos, mensaje, contacto y video de confirmación conservados.
- `/organizacion`: acceso real con contraseña y sesión del servidor; continúa desconectado hasta configurar una base nueva.
- `/organizacion/vista-previa`: diseño vacío del panel, sin consultas ni acciones de escritura.

## Decisiones y límites

No se copiaron la fecha, dominio, huéspedes, tokens ni contraseña simulada del prototipo. La cuenta regresiva muestra guiones hasta establecer `date.iso` y las etiquetas de fecha en `config/wedding.json`. No se han ejecutado migraciones ni conectado ninguna base de datos.

La nueva navegación e inicio reemplazan la lista anterior de secciones de la portada. Los componentes anteriores siguen disponibles para futuras variantes. `pages` sigue controlando historia, preguntas y alojamiento. Los enlaces y distribución del nuevo inicio están en `components/GuestHome.tsx`.

La confirmación sigue siendo por cantidad de asistentes/familia. Para reproducir la confirmación individual del prototipo se recomienda una tabla `invitation_people` con id, invitation_id, nombre y estado de asistencia, validación de pertenencia y transacciones en servidor. El panel necesitaría permitir crear/editar esos nombres, y las respuestas antiguas por cantidad necesitarían una estrategia de transición explícita. No se ha creado ni aplicado esa ampliación.

El envío conserva la copia de mensaje y enlace. Para guardar si una invitación fue enviada se recomienda un campo de fecha `sent_at`, acciones autenticadas y visualización en el panel. No se simula persistencia local ni se envían mensajes automáticamente.

Las restricciones alimentarias existentes se conservan. El acceso seguro no admite cualquier contraseña. La vista previa nunca revela filas reales ni evita la autenticación.
