package in.bchbenjamin.portfolio.contact;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactRequest(
    @NotBlank @Size(max = 160) String name,
    @Size(max = 180) String organization,
    @NotBlank @Email @Size(max = 320) String email,
    @NotBlank @Size(min = 3, max = 180) String subject,
    @NotBlank @Size(min = 20, max = 5000) String message,
    @Size(max = 200) String website
) { }
