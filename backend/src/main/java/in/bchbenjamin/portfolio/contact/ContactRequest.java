package in.bchbenjamin.portfolio.contact;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

public record ContactRequest(
    @NotBlank @Pattern(regexp = "^[^\\r\\n]+$") @Size(max = 160) String name,
    @Pattern(regexp = "^[^\\r\\n]*$") @Size(max = 180) String organization,
    @NotBlank @Email @Pattern(regexp = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$") @Size(max = 320) String email,
    @NotBlank @Pattern(regexp = "^[^\\r\\n]+$") @Size(min = 3, max = 180) String subject,
    @NotBlank @Size(min = 20, max = 5000) String message,
    @Size(max = 200) String website
) { }
