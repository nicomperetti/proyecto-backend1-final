import mongoose from "mongoose";
import BookingsRepository from "../repositories/bookings.repository.js";
import ServicesRepository from "../repositories/services.repository.js";

class BookingsService {
  constructor() {
    this.repository = new BookingsRepository();
    this.servicesRepository = new ServicesRepository();
  }

  getBookings() {
    return this.repository.getAll();
  }

  createBooking(data) {
    return this.repository.create({
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      date: data.date,
      time: data.time,
      status: data.status,
      services: []
    });
  }

  getBookingById(id) {
    return mongoose.isValidObjectId(id) ? this.repository.getById(id) : null;
  }

  async addServiceToBooking(bookingId, serviceId) {
    if (!mongoose.isValidObjectId(bookingId) || !mongoose.isValidObjectId(serviceId)) {
      return { error: "invalid_id" };
    }

    const [booking, service] = await Promise.all([
      this.repository.getByIdRaw(bookingId),
      this.servicesRepository.getById(serviceId)
    ]);

    if (!booking) return { error: "booking_not_found" };
    if (!service) return { error: "service_not_found" };

    // Regla de negocio: una misma referencia de servicio incrementa quantity.
    const existing = booking.services.find(
      (item) => item.service.toString() === serviceId.toString()
    );

    if (existing) existing.quantity += 1;
    else booking.services.push({ service: serviceId, quantity: 1 });

    return {
      booking: await this.repository.update(bookingId, { services: booking.services })
    };
  }
}

export default BookingsService;
