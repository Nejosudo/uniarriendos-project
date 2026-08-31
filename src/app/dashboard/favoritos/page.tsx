import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PropertyCard from '@/componentes/ui/PropertyCard/PropertyCard';
import { redirectSiNoPuedeUsarFavoritos } from '@/lib/suspensiones/guard';
import styles from './page.module.css';
import Link from 'next/link';

export default async function FavoritosPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    await redirectSiNoPuedeUsarFavoritos();

    // Obtener los favoritos del usuario con las propiedades
    const { data: favoritos, error } = await supabase
        .from('favoritos')
        .select(`
            id,
            propiedad:propiedades (
                *,
                anfitrion:perfiles!propiedades_propietario_id_fkey (nombre_completo, avatar_url),
                propiedades_fotos (url),
                servicios_rel:propiedades_servicios (
                    servicio:servicios (nombre, icono)
                )
            )
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al obtener favoritos:', error);
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Mis Favoritos</h1>
                <p className={styles.subtitle}>Las propiedades que has guardado para revisar más tarde.</p>
            </div>

            {!favoritos || favoritos.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>❤️</div>
                    <h2>No tienes favoritos guardados</h2>
                    <p>Explora nuestras propiedades y guarda las que más te gusten haciendo clic en el corazón.</p>
                    <Link href="/explorar" className={styles.exploreBtn}>
                        Explorar Propiedades
                    </Link>
                </div>
            ) : (
                <div className={styles.grid}>
                    {favoritos.map((fav: any) => {
                        const prop = fav.propiedad;
                        if (!prop) return null; // Si la propiedad fue borrada

                        const anfitrion = prop.anfitrion;
                        const fotos = prop.propiedades_fotos;
                        const imagenPrincipal = fotos && fotos.length > 0 ? fotos[0].url : undefined;
                        const servicios = prop.servicios_rel?.map((s: any) => s.servicio) || [];

                        return (
                            <PropertyCard 
                                key={prop.id}
                                id={prop.id}
                                titulo={prop.titulo}
                                precio={prop.precio}
                                ubicacion_texto={prop.ubicacion_texto}
                                imagen_url={imagenPrincipal}
                                vivienda_compartida={prop.vivienda_compartida}
                                estado={prop.estado}
                                prioridad={prop.prioridad}
                                verificada={prop.verificada}
                                perfil_arriendo={prop.perfil_arriendo}
                                anfitrion_nombre={anfitrion?.nombre_completo}
                                anfitrion_avatar={anfitrion?.avatar_url}
                                servicios={servicios}
                                isFavorite={true} // Por definición, si está aquí es favorito
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
