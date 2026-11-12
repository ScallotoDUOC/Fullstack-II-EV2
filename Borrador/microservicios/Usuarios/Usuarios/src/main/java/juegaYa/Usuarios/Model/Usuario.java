package juegaYa.Usuarios.Model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Objects;

/**
 * Cuenta de una persona en JuegaYa (cliente o administrador).
 *
 * Sobre la contraseña: el atributo {@code password} del diagrama NO guarda la
 * contraseña en texto plano, sino un hash PBKDF2 con sal, en formato
 * "iteraciones:sal:hash" (todo en Base64). Para generarlo se usa
 * {@link #hashearPassword(String)} - el AuthService lo llama en registrar() - y
 * {@link #verificarPassword(String)} compara contra ese hash. Se hizo con las
 * clases que trae el JDK para no depender de ninguna librería extra; si más
 * adelante agregan Spring Security, se puede cambiar por BCrypt tocando solo
 * estos dos métodos.
 *
 * Nota sobre el diagrama: Usuario trae también buscarPorEmail, buscarPorId y
 * guardar, pero esas son responsabilidad del UsuarioRepository (que ya las
 * tiene), así que no se implementan acá: una entidad JPA no puede consultar
 * ni guardarse a sí misma.
 */
@Entity
@Table(name = "usuario")
public class Usuario {

    private static final int ITERACIONES = 120_000;
    private static final int LARGO_SAL_BYTES = 16;
    private static final int LARGO_HASH_BITS = 256;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank
    private String nombre;

    @NotBlank
    @Email
    @Column(unique = true, nullable = false)
    private String email;

    /** RUT normalizado ("12345678-5", sin puntos): identificador único del cliente. Null solo en cuentas antiguas. */
    @Column(unique = true, length = 12)
    private String rut;

    private String telefono;

    private String direccion;

    /** Hash de la contraseña (nunca el texto plano). Ver {@link #hashearPassword(String)}. */
    @NotBlank
    private String password;

    @NotNull
    @Enumerated(EnumType.STRING)
    private Rol rol = Rol.CLIENTE;

    private LocalDateTime fechaRegistro = LocalDateTime.now();

    private boolean activo = true;

    protected Usuario() {
        // constructor vacío que pide JPA
    }

    /**
     * @param passwordHash ya hasheada con {@link #hashearPassword(String)}, no la contraseña cruda
     */
    public Usuario(String nombre, String email, String passwordHash, Rol rol) {
        this.nombre = nombre;
        this.email = email;
        this.password = passwordHash;
        this.rol = rol;
    }

    /** Indica si la contraseña ingresada corresponde a la guardada. */
    public boolean verificarPassword(String passwordPlano) {
        if (passwordPlano == null || password == null) {
            return false;
        }
        String[] partes = password.split(":");
        if (partes.length != 3) {
            return false;
        }
        try {
            int iteraciones = Integer.parseInt(partes[0]);
            byte[] sal = Base64.getDecoder().decode(partes[1]);
            byte[] esperado = Base64.getDecoder().decode(partes[2]);
            byte[] calculado = derivar(passwordPlano, sal, iteraciones, esperado.length * 8);
            return MessageDigest.isEqual(esperado, calculado);
        } catch (IllegalArgumentException | GeneralSecurityException e) {
            return false;
        }
    }

    public boolean esAdmin() {
        return rol == Rol.ADMINISTRADOR;
    }

    /** Genera el valor que se guarda en {@code password}: "iteraciones:sal:hash" en Base64. */
    public static String hashearPassword(String passwordPlano) {
        if (passwordPlano == null || passwordPlano.isEmpty()) {
            throw new IllegalArgumentException("La contraseña no puede estar vacía");
        }
        byte[] sal = new byte[LARGO_SAL_BYTES];
        RANDOM.nextBytes(sal);
        try {
            byte[] hash = derivar(passwordPlano, sal, ITERACIONES, LARGO_HASH_BITS);
            return ITERACIONES + ":" + Base64.getEncoder().encodeToString(sal)
                    + ":" + Base64.getEncoder().encodeToString(hash);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo hashear la contraseña", e);
        }
    }

    private static byte[] derivar(String passwordPlano, byte[] sal, int iteraciones, int bits)
            throws GeneralSecurityException {
        PBEKeySpec spec = new PBEKeySpec(passwordPlano.toCharArray(), sal, iteraciones, bits);
        return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRut() {
        return rut;
    }

    public void setRut(String rut) {
        this.rut = rut;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getDireccion() {
        return direccion;
    }

    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }

    public String getPassword() {
        return password;
    }

    /** Debe recibir el hash ({@link #hashearPassword(String)}), no la contraseña en texto plano. */
    public void setPassword(String passwordHash) {
        this.password = passwordHash;
    }

    public Rol getRol() {
        return rol;
    }

    public void setRol(Rol rol) {
        this.rol = rol;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Usuario)) return false;
        Usuario usuario = (Usuario) o;
        return Objects.equals(id, usuario.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        // a propósito sin password, para que no termine en un log por accidente
        return "Usuario{id=" + id + ", nombre='" + nombre + "', email='" + email
                + "', rol=" + rol + ", activo=" + activo + "}";
    }
}
