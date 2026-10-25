import { createClient } from '@/lib/supabase/server';
import AdminUsuariosTable from '@/componentes/admin/AdminUsuariosTable/AdminUsuariosTable';
import styles from './page.module.css';

type SuspensionAdmin = {
    id: number;
    nivel: number;
    motivo: string | null;
    fecha_fin: string | null;
    activa: boolean;
};

type UsuarioAdmin = {
    id: string;
    nombre_completo: string | null;
    email?: string | null;
    telefono: string | null;
    rol: 'usuario' | 'admin';
    ultimo_admin?: boolean;
    propiedades_count?: number;
    pqrs_count?: number;
    resenas_count?: number;
    tipo?: string | null;
    created_at: string;
    suspensiones?: SuspensionAdmin[];
};

function normalizarLista(data: unknown): UsuarioAdmin[] {
    let valor = data;

    if (typeof valor === 'string') {
        try {
            valor = JSON.parse(valor);
        } catch {
            return [];
        }
    }

    if (!Array.isArray(valor)) return [];

    return valor.filter((item): item is UsuarioAdmin =>
        Boolean(item) && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string'
    );
}

export default async function AdminUsuariosPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: usuariosRpc, error: rpcError } = await supabase.rpc('admin_listar_usuarios');
    let usuarios = normalizarLista(usuariosRpc);
    let aviso: string | null = null;

    if (rpcError) {
        console.error('Error cargando usuarios admin (RPC):', {
            code: rpcError.code,
            message: rpcError.message,
            details: rpcError.details,
            hint: rpcError.hint,
        });
    }

    if (rpcError || usuarios.length === 0) {
        const { data: fallback, error: fallbackError } = await supabase
            .from('perfiles')
            .select(`
                id,
                nombre_completo,
                rol,
                tipo,
                created_at,
                suspensiones!suspensiones_usuario_id_fkey (
                    id,
                    nivel,
                    motivo,
                    fecha_fin,
                    activa
                )
            `)
            .order('created_at', { ascending: false });

        if (fallbackError) {
            console.error('Error cargando usuarios admin (fallback):', {
                code: fallbackError.code,
                message: fallbackError.message,
                details: fallbackError.details,
                hint: fallbackError.hint,
            });
        } else if (Array.isArray(fallback) && fallback.length > 0) {
            usuarios = fallback.map((usuario) => ({
                ...usuario,
                telefono: null,
            })) as UsuarioAdmin[];
            aviso = 'No se pudieron cargar los teléfonos, pero puedes gestionar roles y suspensiones.';
        }

        if (usuarios.length === 0) {
            aviso = 'No se pudo cargar la lista de usuarios. Revisa los logs del servidor.';
        }
    }

    const totalAdmins = usuarios.filter((usuario) => usuario.rol === 'admin').length;
    const usuariosNormalizados = usuarios.map((usuario) => ({
        ...usuario,
        ultimo_admin: usuario.rol === 'admin' && totalAdmins <= 1,
    }));

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Gestión de Usuarios</h1>
                <p className={styles.subtitle}>
                    Administra roles y suspensiones de los usuarios de la plataforma.
                </p>
                {aviso && <p className={styles.subtitle}>{aviso}</p>}
            </header>
            <AdminUsuariosTable usuarios={usuariosNormalizados} currentUserId={user?.id ?? ''} />
        </div>
    );
}
