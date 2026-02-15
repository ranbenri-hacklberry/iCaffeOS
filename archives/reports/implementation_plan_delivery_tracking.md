# Implementation Plan: Delivery & Tracking System

## Overview

This plan outlines the development of the dedicated Driver Mobile Interface and Customer Order Tracking screen, alongside critical fixes for customer data persistence and address visibility.

## Phase 1: Critical Fixes (Customer Data & Addresses)

**Objective:** Ensure every delivery order reliably saves customer contact info and address, both in the `orders` table for history and `customers` table for future lookup.

1. **Address Persistence Fix:**
    * **Audit `DeliveryAddressModal`:** Ensure the final address string is correctly constructed and passed back to the parent.
    * **Debug `submit_order` Flow:** Verify that `p_delivery_address` is correctly populated in the RPC call payload in `MenuOrderingInterface`.
    * **Customer Record Update:** Reinforce the "Auto-Save" logic injected earlier to ensure it handles edge cases (e.g., updating existing customers' addresses without overwriting notes).
    * **UI Validations:** Add visual confirmation in the Order Card (Kanban) that an address exists (e.g., turn the pin icon green or show a snippet).

## Phase 2: Driver Mobile Interface (`/driver`)

**Objective:** A simplified, mobile-first dashboard for drivers to manage their active run.

* **Route:** `/driver` (Protected, requires `is_driver` role).
* **Design:** High-contrast, large buttons (easy to tap while working), Dark Mode supported.
* **Key Features:**
  * **My Tasks List:** Filter orders by `driver_id = current_user` AND `status = 'ready' | 'shipped'`.
  * **Order Card:**
    * **Header:** Order # + Customer Name
    * **Actionable Info:**
      * 📞 **Call Button** (Direct `tel:` link).
      * 📍 **Waze/Maps Button** (Direct link to navigation).
      * 🏠 **Address Display** (Large text).
    * **Status Toggle:** Swipe or Tap to "Mark as Delivered".
  * **History Tab:** View completed deliveries from the last 24h.

## Phase 3: Customer Order Tracking (`/track/:orderId`)

**Objective:** A public-facing status page for customers to reduce "Where is my food?" calls.

* **Route:** `/track/:orderId` (Public).
* **Design:** Friendly, branded, "Domino's Tracker" style.
* **Components:**
  * **Status Stepper:** Received ➔ In Kitchen ➔ Packing ➔ Out for Delivery ➔ Delivered.
  * **Courier Info:** "Your courier [Name] is on the way!".
  * **ETA:** (Optional) Estimated time based on prep + drive time.
  * **Support:** "Have an issue?" button (WhatsApp link to business).

## Phase 4: Integration

1. **SMS Links:** Update the "Out for Delivery" SMS to include the `domain.com/track/:orderId` link.
2. **QR Codes:** Generate dynamic QR codes for drivers to quickly load their manifest (optional).

## Next Steps (Tomorrow Morning)

1. **Start with Phase 1:** Debug why specific addresses aren't showing.
2. **Build Phase 2:** Create the basic `/driver` layout.
3. **Build Phase 3:** Create the `/track` page.
