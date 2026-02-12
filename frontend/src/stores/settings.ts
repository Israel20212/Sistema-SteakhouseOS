import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
    const restaurantName = ref('Steakhouse OS');
    const primaryColor = ref('#000000');
    const secondaryColor = ref('#FFFFFF');
    const accentColor = ref('#D4AF37');
    const logoUrl = ref<string | null>(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    // Ticket customization fields
    const ticketSlogan = ref('Prime Cuts & Drinks');
    const ticketAddress = ref('Calle Principal #123');
    const ticketPhone = ref<string | null>(null);
    const ticketFooter = ref('¡Gracias por su visita!');
    const ticketFooter2 = ref('Propina no incluida');

    async function fetchSettings() {
        try {
            const response = await fetch(`${API_URL}/api/settings`);
            if (response.ok) {
                const data = await response.json();
                restaurantName.value = data.restaurant_name;
                primaryColor.value = data.primary_color || '#000000';
                secondaryColor.value = data.secondary_color || '#FFFFFF';
                accentColor.value = data.accent_color || '#D4AF37';
                logoUrl.value = data.logo_url;

                // Load ticket customization fields
                ticketSlogan.value = data.ticket_slogan || 'Prime Cuts & Drinks';
                ticketAddress.value = data.ticket_address || 'Calle Principal #123';
                ticketPhone.value = data.ticket_phone || null;
                ticketFooter.value = data.ticket_footer || '¡Gracias por su visita!';
                ticketFooter2.value = data.ticket_footer_2 || 'Propina no incluida';

                // Helper to convert hex to rgb for Tailwind opacity support
                const hexToRgb = (hex: string) => {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? `${parseInt(result[1]!, 16)} ${parseInt(result[2]!, 16)} ${parseInt(result[3]!, 16)}` : '0 0 0';
                };

                // Set CSS variables for theme
                document.documentElement.style.setProperty('--color-primary', hexToRgb(primaryColor.value ?? '#000000'));
                document.documentElement.style.setProperty('--color-secondary', hexToRgb(secondaryColor.value ?? '#FFFFFF'));
                document.documentElement.style.setProperty('--color-accent', hexToRgb(accentColor.value ?? '#D4AF37'));

                // Backward compatibility for existing gold usages
                document.documentElement.style.setProperty('--color-gold', accentColor.value ?? '#D4AF37');
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    }

    return {
        restaurantName,
        primaryColor,
        secondaryColor,
        accentColor,
        logoUrl,
        ticketSlogan,
        ticketAddress,
        ticketPhone,
        ticketFooter,
        ticketFooter2,
        fetchSettings
    };
});
